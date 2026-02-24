import { Hono } from "hono";
import type { Env } from "../env.js";
import type { AdminDashboard, GlobalStats } from "@siteage/shared";
import { queryDohTxt, querySystemDns } from "../services/verification.js";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Admin authentication middleware
adminRoutes.use("*", async (c, next) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: "unauthorized", message: "Invalid admin key" }, 401);
  }
  await next();
});

// GET /admin/dashboard
adminRoutes.get("/dashboard", async (c) => {
  const total = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains").first();
  const active = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'active'").first();
  const dead = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'dead'").first();
  const verified = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE verification_status = 'verified'").first();
  const oldest = await c.env.DB.prepare(
    "SELECT domain, COALESCE(verified_birth_at, birth_at) as birth FROM domains WHERE birth_at IS NOT NULL ORDER BY birth ASC LIMIT 1"
  ).first();
  const pendingEvidence = await c.env.DB.prepare("SELECT COUNT(*) as count FROM evidence WHERE status = 'pending'").first();

  const stats: GlobalStats = {
    total_domains: (total?.count as number) || 0,
    active_domains: (active?.count as number) || 0,
    dead_domains: (dead?.count as number) || 0,
    verified_domains: (verified?.count as number) || 0,
    oldest_domain: (oldest?.domain as string) || null,
    oldest_birth_at: (oldest?.birth as string) || null,
  };

  const dashboard: AdminDashboard = {
    stats,
    pending_evidence_count: (pendingEvidence?.count as number) || 0,
  };

  return c.json(dashboard);
});

// GET /admin/evidence - List pending evidence
adminRoutes.get("/evidence", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT e.*, d.domain
     FROM evidence e
     JOIN domains d ON e.domain_id = d.id
     WHERE e.status = 'pending'
     ORDER BY e.created_at ASC`
  ).all();

  return c.json(rows.results || []);
});

// POST /admin/evidence/:id/review - Approve or reject evidence
adminRoutes.post("/evidence/:id/review", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ action: "approved" | "rejected" }>();

  if (!["approved", "rejected"].includes(body.action)) {
    return c.json({ error: "bad_request", message: "action must be 'approved' or 'rejected'" }, 400);
  }

  const evidence = await c.env.DB.prepare(
    "SELECT * FROM evidence WHERE id = ? AND status = 'pending'"
  ).bind(id).first();

  if (!evidence) {
    return c.json({ error: "not_found", message: "Evidence not found or already reviewed" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE evidence SET status = ?, reviewed_at = datetime('now') WHERE id = ?"
  ).bind(body.action, id).run();

  // If approved, update domain's verified_birth_at
  if (body.action === "approved") {
    const domainId = evidence.domain_id as number;
    const claimedAt = evidence.claimed_at as string;

    // Basic validation: claimed date cannot be in the future
    if (new Date(claimedAt) > new Date()) {
      return c.json({ error: "bad_request", message: "Claimed date cannot be in the future" }, 400);
    }

    // Update verified_birth_at unconditionally (admin has reviewed and approved)
    await c.env.DB.prepare(
      "UPDATE domains SET verified_birth_at = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(claimedAt, domainId).run();

    // Clear all caches
    const domain = await c.env.DB.prepare("SELECT domain FROM domains WHERE id = ?").bind(domainId).first();
    const domainName = domain?.domain as string;
    await Promise.all([
      c.env.API_CACHE.delete(`lookup:${domainName}`),
      c.env.API_CACHE.delete(`domain:${domainName}`),
      c.env.BADGE_CACHE.delete(`domain:${domainName}`),
    ]);
  }

  return c.json({ success: true, message: `Evidence ${body.action}` });
});

// GET /admin/domains - List domains with pagination and filtering
adminRoutes.get("/domains", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 100);
  const status = c.req.query("status");
  const search = c.req.query("search");
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: unknown[] = [];

  if (status) {
    where += " AND d.status = ?";
    params.push(status);
  }
  if (search) {
    where += " AND d.domain LIKE ?";
    params.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) as count FROM domains d ${where}`;
  const countStmt = c.env.DB.prepare(countQuery);
  const countResult = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first();
  const total = (countResult?.count as number) || 0;

  const dataQuery = `SELECT d.id, d.domain, d.birth_at, d.verified_birth_at, d.status, d.verification_status, d.consecutive_failures, d.badge_embedded, d.last_checked_at, d.created_at,
    (SELECT v.magic_key FROM verifications v WHERE v.domain_id = d.id AND v.status = 'verified' AND v.magic_key IS NOT NULL ORDER BY v.verified_at DESC LIMIT 1) as magic_key,
    (SELECT v.email FROM verifications v WHERE v.domain_id = d.id AND v.status = 'verified' ORDER BY v.verified_at DESC LIMIT 1) as email
    FROM domains d ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
  const dataStmt = c.env.DB.prepare(dataQuery);
  const dataResult = await dataStmt.bind(...params, limit, offset).all();

  return c.json({
    domains: dataResult.results || [],
    total,
    page,
    limit,
  });
});

// POST /admin/domains/:id - Update domain status manually
adminRoutes.post("/domains/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ status?: string; birth_at?: string; verified_birth_at?: string }>();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.status && ["active", "unreachable", "dead", "unknown"].includes(body.status)) {
    updates.push("status = ?");
    params.push(body.status);

    if (body.status === "dead") {
      updates.push("death_at = datetime('now')");
    } else if (body.status === "active") {
      updates.push("death_at = NULL");
      updates.push("consecutive_failures = 0");
    }
  }

  if (body.verified_birth_at) {
    updates.push("verified_birth_at = ?");
    params.push(body.verified_birth_at);
  }

  if (updates.length === 0) {
    return c.json({ error: "bad_request", message: "No valid fields to update" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  await c.env.DB.prepare(
    `UPDATE domains SET ${updates.join(", ")} WHERE id = ?`
  ).bind(...params).run();

  // Clear all caches (API + Badge)
  const domain = await c.env.DB.prepare("SELECT domain FROM domains WHERE id = ?").bind(id).first();
  if (domain) {
    const name = domain.domain as string;
    await Promise.all([
      c.env.API_CACHE.delete(`lookup:${name}`),
      c.env.API_CACHE.delete(`domain:${name}`),
      c.env.BADGE_CACHE.delete(`domain:${name}`),
    ]);
  }

  return c.json({ success: true });
});

// GET /admin/dns-check/:domain - DNS TXT diagnostic endpoint
adminRoutes.get("/dns-check/:domain", async (c) => {
  const domain = c.req.param("domain");

  // Query all DNS providers in parallel
  const [cloudflare, google, alidns, system] = await Promise.all([
    queryDohTxt(domain, "https://cloudflare-dns.com/dns-query", "Cloudflare"),
    queryDohTxt(domain, "https://dns.google/resolve", "Google"),
    queryDohTxt(domain, "https://dns.alidns.com/resolve", "AliDNS"),
    querySystemDns(domain),
  ]);

  // Fetch pending verification records for this domain
  const pendingRows = await c.env.DB.prepare(
    `SELECT v.method, v.token, v.email, v.expires_at, v.created_at, v.last_attempt_at
     FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.status = 'pending'
     ORDER BY v.created_at DESC`
  ).bind(domain).all();

  const pending = (pendingRows.results || []).map((row) => ({
    method: row.method,
    token: row.token,
    expected: `siteage-verify=${row.token}`,
    email: row.email,
    expires_at: row.expires_at,
    created_at: row.created_at,
    last_attempt_at: row.last_attempt_at,
  }));

  return c.json({
    domain,
    resolvers: { cloudflare, google, alidns, system },
    pending_verifications: pending,
  });
});

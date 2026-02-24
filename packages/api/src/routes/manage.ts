import { Hono } from "hono";
import type { Env } from "../env.js";
import { isValidDomain, normalizeDomain, evaluateBirthDateChange } from "@siteage/shared";
import type { ManageData, BirthDateUpdateRequest, BirthDateUpdateResult } from "@siteage/shared";

export const manageRoutes = new Hono<{ Bindings: Env }>();

// GET /manage/:domain?key=xxx
manageRoutes.get("/:domain", async (c) => {
  const domain = c.req.param("domain");
  const key = c.req.query("key");

  if (!domain || !isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  if (!key) {
    return c.json({ error: "unauthorized", message: "Management key is required" }, 401);
  }

  // Verify magic key
  const verification = await c.env.DB.prepare(
    `SELECT v.email, v.domain_id, d.domain, d.birth_at, d.verified_birth_at, d.status, d.verification_status, d.created_at
     FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.magic_key = ? AND v.status = 'verified'
     LIMIT 1`
  ).bind(domain, key).first();

  if (!verification) {
    return c.json({ error: "unauthorized", message: "Invalid or expired management key" }, 401);
  }

  const domainId = verification.domain_id as number;

  // Get evidence submissions
  const evidenceRows = await c.env.DB.prepare(
    "SELECT id, type, claimed_at, status, rejection_reason, created_at FROM evidence WHERE domain_id = ? ORDER BY created_at DESC"
  ).bind(domainId).all();

  const data: ManageData = {
    domain: verification.domain as string,
    birth_at: verification.birth_at as string | null,
    verified_birth_at: verification.verified_birth_at as string | null,
    status: verification.status as string,
    verification_status: verification.verification_status as string,
    email: verification.email as string,
    evidence: (evidenceRows.results || []).map((e) => ({
      id: e.id as number,
      type: e.type as string,
      claimed_at: e.claimed_at as string,
      status: e.status as string,
      rejection_reason: (e.rejection_reason as string) || null,
      created_at: e.created_at as string,
    })),
  };

  return c.json(data);
});

// POST /manage/:domain/birth-date - Smart birth date update
manageRoutes.post("/:domain/birth-date", async (c) => {
  const domain = normalizeDomain(c.req.param("domain"));
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  const body = await c.req.json<BirthDateUpdateRequest>();
  if (!body.key || !body.birth_at) {
    return c.json({ error: "bad_request", message: "key and birth_at are required" }, 400);
  }

  // Validate date format
  const proposed = new Date(body.birth_at);
  if (isNaN(proposed.getTime())) {
    return c.json<BirthDateUpdateResult>({ outcome: "rejected", message: "Invalid date format" }, 400);
  }

  // Reject future dates
  if (proposed.getTime() > Date.now()) {
    return c.json<BirthDateUpdateResult>({ outcome: "rejected", message: "Birth date cannot be in the future" }, 400);
  }

  // Verify magic key and get domain data
  const row = await c.env.DB.prepare(
    `SELECT v.domain_id, d.domain, d.birth_at, d.created_at
     FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.magic_key = ? AND v.status = 'verified'
     LIMIT 1`
  ).bind(domain, body.key).first();

  if (!row) {
    return c.json({ error: "unauthorized", message: "Invalid or expired management key" }, 401);
  }

  const domainId = row.domain_id as number;
  const cdxBirthAt = row.birth_at as string | null;
  const createdAt = row.created_at as string;

  // Evaluate suspicion
  const evaluation = evaluateBirthDateChange(body.birth_at, cdxBirthAt, createdAt);

  if (!evaluation.suspicious) {
    // Auto-approve: update verified_birth_at directly
    await c.env.DB.prepare(
      "UPDATE domains SET verified_birth_at = ? WHERE id = ?"
    ).bind(body.birth_at, domainId).run();

    // Clear both caches
    await Promise.all([
      c.env.API_CACHE.delete(`lookup:${domain}`),
      c.env.API_CACHE.delete(`domain:${domain}`),
      c.env.BADGE_CACHE.delete(`domain:${domain}`),
    ]);

    return c.json<BirthDateUpdateResult>({ outcome: "auto_approved", birth_at: body.birth_at });
  }

  // Suspicious — require evidence
  const baseline = cdxBirthAt ?? createdAt;
  const baselineFormatted = baseline.slice(0, 10);
  return c.json<BirthDateUpdateResult>(
    {
      outcome: "requires_evidence",
      reason: `The date you entered is more than 1 year earlier than our reference date (${baselineFormatted}). Please provide evidence to support this earlier date.`,
    },
    422,
  );
});

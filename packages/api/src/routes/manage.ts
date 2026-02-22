import { Hono } from "hono";
import type { Env } from "../env.js";
import { isValidDomain } from "@siteage/shared";
import type { ManageData } from "@siteage/shared";

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
    `SELECT v.email, v.domain_id, d.domain, d.birth_at, d.verified_birth_at, d.status, d.verification_status
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
    "SELECT id, type, claimed_at, status, created_at FROM evidence WHERE domain_id = ? ORDER BY created_at DESC"
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
      created_at: e.created_at as string,
    })),
  };

  return c.json(data);
});

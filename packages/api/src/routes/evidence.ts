import { Hono } from "hono";
import type { Env } from "../env.js";
import { normalizeDomain, isValidDomain } from "@siteage/shared";
import type { EvidenceSubmitRequest } from "@siteage/shared";

export const evidenceRoutes = new Hono<{ Bindings: Env }>();

// POST /evidence/submit - Submit evidence for earlier birth date
evidenceRoutes.post("/submit", async (c) => {
  const body = await c.req.json<EvidenceSubmitRequest>();

  if (!body.domain || !body.key || !body.type || !body.claimed_at || !body.description) {
    return c.json({ error: "bad_request", message: "domain, key, type, claimed_at, and description are required" }, 400);
  }

  const domain = normalizeDomain(body.domain);
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  if (!["whois", "git_history", "dns_record", "product_hunt", "hacker_news", "web_archive", "press_coverage", "other"].includes(body.type)) {
    return c.json({ error: "bad_request", message: "Invalid evidence type" }, 400);
  }

  // Verify magic key authorization
  const verification = await c.env.DB.prepare(
    `SELECT v.id, v.domain_id FROM verifications v
     JOIN domains d ON v.domain_id = d.id
     WHERE d.domain = ? AND v.magic_key = ? AND v.status = 'verified'
     LIMIT 1`
  ).bind(domain, body.key).first();

  if (!verification) {
    return c.json({ error: "unauthorized", message: "Invalid or expired management key" }, 401);
  }

  const domainId = verification.domain_id as number;

  // Insert evidence
  await c.env.DB.prepare(
    "INSERT INTO evidence (domain_id, type, claimed_at, description, url) VALUES (?, ?, ?, ?, ?)"
  ).bind(domainId, body.type, body.claimed_at, body.description || null, body.url || null).run();

  return c.json({ success: true, message: "Evidence submitted successfully. An admin will review it." });
});

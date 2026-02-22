import { Hono } from "hono";
import type { Env } from "../env.js";
import { normalizeDomain, isValidDomain } from "@siteage/shared";
import type { VerifyInitRequest, VerifyCheckRequest, VerifyResendRequest } from "@siteage/shared";
import { initVerification, checkVerification, resendMagicLink } from "../services/verification.js";

export const verifyRoutes = new Hono<{ Bindings: Env }>();

// POST /verify/init - Initialize verification
verifyRoutes.post("/init", async (c) => {
  const body = await c.req.json<VerifyInitRequest>();

  if (!body.domain || !body.email || !body.method) {
    return c.json({ error: "bad_request", message: "domain, email, and method are required" }, 400);
  }

  const domain = normalizeDomain(body.domain);
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  if (!["dns_txt", "meta_tag"].includes(body.method)) {
    return c.json({ error: "bad_request", message: "method must be dns_txt or meta_tag" }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: "bad_request", message: "Invalid email address" }, 400);
  }

  const result = await initVerification(c.env, domain, body.email, body.method);
  return c.json(result);
});

// POST /verify/check - Check verification status
verifyRoutes.post("/check", async (c) => {
  const body = await c.req.json<VerifyCheckRequest>();

  if (!body.domain || !body.token) {
    return c.json({ error: "bad_request", message: "domain and token are required" }, 400);
  }

  const domain = normalizeDomain(body.domain);
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  const result = await checkVerification(c.env, domain, body.token);
  return c.json(result);
});

// POST /verify/resend - Resend Magic Link
verifyRoutes.post("/resend", async (c) => {
  const body = await c.req.json<VerifyResendRequest>();

  if (!body.domain || !body.email) {
    return c.json({ error: "bad_request", message: "domain and email are required" }, 400);
  }

  const domain = normalizeDomain(body.domain);
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  const result = await resendMagicLink(c.env, domain, body.email);
  if (!result.success) {
    return c.json({ error: "not_found", message: result.message }, 404);
  }
  return c.json(result);
});

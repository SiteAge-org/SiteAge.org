import { Hono } from "hono";
import type { Env } from "../env.js";
import { normalizeDomain, isValidDomain, LOOKUP_CACHE_TTL, BADGE_BASE_URL, WEB_BASE_URL } from "@siteage/shared";
import type { LookupRequest, LookupResponse } from "@siteage/shared";
import { archaeologyService } from "../services/archaeology.js";
import { ageDays } from "@siteage/shared";

export const lookupRoutes = new Hono<{ Bindings: Env }>();

lookupRoutes.post("/lookup", async (c) => {
  const body = await c.req.json<LookupRequest>();
  if (!body.url) {
    return c.json({ error: "bad_request", message: "URL is required" }, 400);
  }

  const domain = normalizeDomain(body.url);
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  const result = await archaeologyService(c.env, domain);

  const response: LookupResponse = {
    domain: result.domain,
    birth_at: result.birth_at,
    age_days: result.birth_at ? ageDays(result.birth_at) : null,
    status: result.status,
    verification_status: result.verification_status,
    badge_url: `${BADGE_BASE_URL}/${domain}`,
    detail_url: `${WEB_BASE_URL}/${domain}`,
  };

  return c.json(response);
});

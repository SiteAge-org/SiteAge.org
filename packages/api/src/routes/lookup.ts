import { Hono } from "hono";
import type { Env } from "../env.js";
import { normalizeDomain, isValidDomain, BADGE_BASE_URL, WEB_BASE_URL, REFRESH_COOLDOWN_TTL } from "@siteage/shared";
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

  // Handle force refresh
  if (body.force) {
    // Check cooldown to prevent abuse
    const cooldownKey = `refresh:${domain}`;
    const cooldown = await c.env.API_CACHE.get(cooldownKey);
    if (cooldown) {
      return c.json({ error: "rate_limited", message: "Please wait before refreshing again" }, 429);
    }

    // Set cooldown
    await c.env.API_CACHE.put(cooldownKey, "1", { expirationTtl: REFRESH_COOLDOWN_TTL });

    // Clear all KV caches (API + Badge + OG)
    await Promise.all([
      c.env.API_CACHE.delete(`lookup:${domain}`),
      c.env.API_CACHE.delete(`domain:${domain}`),
      c.env.BADGE_CACHE.delete(`domain:${domain}`),
      c.env.BADGE_CACHE.delete(`og:${domain}`),
    ]);

    // Clear D1 records
    await Promise.all([
      c.env.DB.prepare("DELETE FROM cdx_queries WHERE domain = ?").bind(domain).run(),
      c.env.DB.prepare("DELETE FROM domains WHERE domain = ?").bind(domain).run(),
    ]);
  }

  const result = await archaeologyService(c.env, domain);

  if (result.cdx_failed) {
    // Clear cached failure so next retry hits CDX directly
    await c.env.API_CACHE.delete(`lookup:${domain}`);
    return c.json({
      error: "cdx_failed",
      message: "Unable to query the Internet Archive. Please try again later.",
    }, 503);
  }

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

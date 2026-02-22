import { Hono } from "hono";
import type { Env } from "../env.js";
import { isValidDomain, ageDays, BADGE_BASE_URL, DOMAIN_CACHE_TTL, waybackUrl } from "@siteage/shared";
import type { DomainDetail } from "@siteage/shared";
import { getRankPercentile } from "../services/ranking.js";

export const domainRoutes = new Hono<{ Bindings: Env }>();

domainRoutes.get("/:domain{[a-z0-9.-]+\\.[a-z]{2,}}", async (c) => {
  const domain = c.req.param("domain");
  if (!isValidDomain(domain)) {
    return c.json({ error: "bad_request", message: "Invalid domain" }, 400);
  }

  // Check KV cache
  const cacheKey = `domain:${domain}`;
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Query D1
  const row = await c.env.DB.prepare(
    "SELECT * FROM domains WHERE domain = ?"
  ).bind(domain).first();

  if (!row) {
    return c.json({ error: "not_found", message: "Domain not found. Use /lookup to query it first." }, 404);
  }

  const birthAt = (row.verified_birth_at || row.birth_at) as string | null;

  // Get CDX query for first snapshot URL
  const cdxRow = await c.env.DB.prepare(
    "SELECT earliest_timestamp FROM cdx_queries WHERE domain = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(domain).first();

  const firstSnapshotUrl = cdxRow?.earliest_timestamp
    ? waybackUrl(cdxRow.earliest_timestamp as string, domain)
    : null;

  const rankPercentile = birthAt ? await getRankPercentile(c.env, birthAt) : null;

  const detail: DomainDetail = {
    domain: row.domain as string,
    birth_at: row.birth_at as string | null,
    death_at: row.death_at as string | null,
    verified_birth_at: row.verified_birth_at as string | null,
    status: row.status as string,
    verification_status: row.verification_status as string,
    age_days: birthAt ? ageDays(birthAt) : null,
    rank_percentile: rankPercentile,
    first_snapshot_url: firstSnapshotUrl,
    badge_url: `${BADGE_BASE_URL}/${domain}`,
    badge_embedded: row.badge_embedded === 1,
    created_at: row.created_at as string,
  };

  // Cache result
  await c.env.API_CACHE.put(cacheKey, JSON.stringify(detail), { expirationTtl: DOMAIN_CACHE_TTL });

  return c.json(detail);
});

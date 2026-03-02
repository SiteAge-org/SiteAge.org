import { Hono } from "hono";
import type { Env } from "../env.js";
import { isValidDomain, ageDays, BADGE_BASE_URL, DOMAIN_CACHE_TTL, waybackUrl, SOURCE_LABELS } from "@siteage/shared";
import type { DomainDetail, SourceInfo } from "@siteage/shared";
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

  const birthAt = (row.verified_birth_at || row.best_birth_at || row.birth_at) as string | null;

  // Get CDX query for first snapshot URL
  const cdxRow = await c.env.DB.prepare(
    "SELECT earliest_timestamp FROM cdx_queries WHERE domain = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(domain).first();

  const firstSnapshotUrl = cdxRow?.earliest_timestamp
    ? waybackUrl(cdxRow.earliest_timestamp as string, domain)
    : null;

  const rankPercentile = birthAt ? await getRankPercentile(c.env, birthAt) : null;

  // Query source_queries for latest results per source
  const sourceRows = await c.env.DB.prepare(
    `SELECT sq.* FROM source_queries sq
     INNER JOIN (
       SELECT domain, source, MAX(id) as max_id
       FROM source_queries WHERE domain = ?
       GROUP BY domain, source
     ) latest ON sq.id = latest.max_id`
  ).bind(domain).all();

  const sources: SourceInfo[] = (sourceRows.results || []).map((sr) => {
    const rawData = JSON.parse((sr.raw_data as string) || "{}");
    const source = sr.source as string;
    return {
      source,
      source_label: SOURCE_LABELS[source] || source,
      earliest_date: sr.earliest_date as string | null,
      confidence: sr.confidence as "high" | "medium" | "low",
      detail_url: getDetailUrl(source, domain, rawData),
      summary: rawData,
      error: sr.error as string | undefined,
    };
  });

  const detail: DomainDetail = {
    domain: row.domain as string,
    birth_at: row.birth_at as string | null,
    best_birth_at: row.best_birth_at as string | null,
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
    sources,
  };

  // Cache result
  await c.env.API_CACHE.put(cacheKey, JSON.stringify(detail), { expirationTtl: DOMAIN_CACHE_TTL });

  return c.json(detail);
});

/**
 * Generate an external detail URL for a given source.
 */
function getDetailUrl(source: string, domain: string, rawData: Record<string, unknown>): string | null {
  switch (source) {
    case "cdx":
      return rawData.first_snapshot_url as string ?? `https://web.archive.org/web/*/${domain}`;
    case "crt":
      return `https://crt.sh/?q=${encodeURIComponent(domain)}`;
    case "rdap":
      return `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    case "whois":
      return `https://who.is/whois/${encodeURIComponent(domain)}`;
    case "commoncrawl":
      return `https://index.commoncrawl.org/CC-MAIN-2024-10-index?url=${encodeURIComponent(domain)}&output=json`;
    default:
      return null;
  }
}

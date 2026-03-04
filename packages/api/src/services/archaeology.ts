import type { Env } from "../env.js";
import { LOOKUP_CACHE_TTL, LOOKUP_ERROR_CACHE_TTL } from "@siteage/shared";
import { getActiveSources } from "./sources/registry.js";
import { resolveBestDate, getSourcesSummary } from "./sources/resolve.js";
import type { SourceResult } from "./sources/types.js";

export interface ArchaeologyResult {
  domain: string;
  birth_at: string | null;
  best_birth_at: string | null;
  status: string;
  verification_status: string;
  sources_queried: string[];
  sources_failed: string[];
  all_failed?: boolean;
  /** @deprecated Use all_failed instead */
  cdx_failed?: boolean;
}

/**
 * Archaeology service: look up a domain's birth date using multiple data sources.
 * Check flow: KV cache → D1 → parallel source queries → store → return
 * Pass force: true to skip caches and re-query all sources (for force refresh).
 */
export async function archaeologyService(env: Env, domain: string, options?: { force?: boolean }): Promise<ArchaeologyResult> {
  const cacheKey = `lookup:${domain}`;

  if (!options?.force) {
    // 1. Check KV cache
    const cached = await env.API_CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Check D1
    const existing = await env.DB.prepare(
      "SELECT domain, birth_at, best_birth_at, status, verification_status FROM domains WHERE domain = ?"
    ).bind(domain).first();

    if (existing) {
      const result: ArchaeologyResult = {
        domain: existing.domain as string,
        birth_at: existing.birth_at as string | null,
        best_birth_at: existing.best_birth_at as string | null,
        status: existing.status as string,
        verification_status: existing.verification_status as string,
        sources_queried: [],
        sources_failed: [],
      };
      await env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: LOOKUP_CACHE_TTL });
      return result;
    }
  }

  // 3. Query all data sources in parallel
  const sources = getActiveSources(env.CDX_API_BASE);
  console.log(`[Sources] Querying ${sources.length} sources for ${domain}`);

  const settledResults = await Promise.allSettled(
    sources.map((s) => s.query(domain))
  );

  const sourceResults: SourceResult[] = settledResults.map((settled, i) => {
    if (settled.status === "fulfilled") {
      return settled.value;
    }
    // Promise rejected (shouldn't happen since each source catches internally)
    return {
      source: sources[i].name,
      earliest_date: null,
      raw_data: {},
      confidence: "high" as const,
      queried_at: new Date().toISOString(),
      error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
    };
  });

  const { sources_queried, sources_failed } = getSourcesSummary(sourceResults);
  const allFailed = sources_failed.length === sources_queried.length;

  // Extract CDX-specific result for backward compatibility
  const cdxResult = sourceResults.find((r) => r.source === "cdx");
  const cdxBirthAt = cdxResult?.earliest_date ?? null;

  // Compute best birth date across all sources
  const bestBirthAt = resolveBestDate(sourceResults);

  // Determine status
  let status = "unknown";
  if (bestBirthAt) {
    status = "active";
  }

  if (allFailed) {
    // All sources failed: cache with short TTL, do NOT persist to D1
    const result: ArchaeologyResult = {
      domain,
      birth_at: null,
      best_birth_at: null,
      status: "unknown",
      verification_status: "detected",
      sources_queried,
      sources_failed,
      all_failed: true,
      cdx_failed: true,
    };
    await env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: LOOKUP_ERROR_CACHE_TTL });
    return result;
  }

  // 4. Store source query results
  await storeSourceResults(env, domain, sourceResults);

  // 5. Write CDX audit record for backward compatibility
  if (cdxResult && !cdxResult.error) {
    try {
      await env.DB.prepare(
        "INSERT INTO cdx_queries (domain, earliest_timestamp, snapshot_count) VALUES (?, ?, ?)"
      ).bind(
        domain,
        cdxResult.raw_data.earliest_timestamp ?? null,
        cdxResult.raw_data.snapshot_count ?? 0
      ).run();
    } catch {
      // Non-critical: cdx_queries is a legacy audit table
    }
  }

  // 6. Upsert into D1 domains table
  if (options?.force) {
    // Force refresh: update existing record, preserving verified_birth_at and verification_status
    const updated = await env.DB.prepare(
      "UPDATE domains SET birth_at = ?, best_birth_at = ?, status = ?, updated_at = datetime('now') WHERE domain = ?"
    ).bind(cdxBirthAt, bestBirthAt, status, domain).run();
    // If domain didn't exist yet, insert it
    if (!updated.meta.changes) {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO domains (domain, birth_at, best_birth_at, status) VALUES (?, ?, ?, ?)"
      ).bind(domain, cdxBirthAt, bestBirthAt, status).run();
    }
  } else {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO domains (domain, birth_at, best_birth_at, status) VALUES (?, ?, ?, ?)"
    ).bind(domain, cdxBirthAt, bestBirthAt, status).run();
  }

  // Re-query to get the actual stored record (may differ if another request won the race)
  const inserted = await env.DB.prepare(
    "SELECT domain, birth_at, best_birth_at, status, verification_status FROM domains WHERE domain = ?"
  ).bind(domain).first();

  const result: ArchaeologyResult = {
    domain: inserted?.domain as string ?? domain,
    birth_at: inserted?.birth_at as string | null ?? cdxBirthAt,
    best_birth_at: inserted?.best_birth_at as string | null ?? bestBirthAt,
    status: inserted?.status as string ?? status,
    verification_status: inserted?.verification_status as string ?? "detected",
    sources_queried,
    sources_failed,
  };

  // 7. Cache result
  await env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: LOOKUP_CACHE_TTL });

  return result;
}

/**
 * Store all source query results to the source_queries table.
 */
async function storeSourceResults(env: Env, domain: string, results: SourceResult[]): Promise<void> {
  const stmt = env.DB.prepare(
    "INSERT INTO source_queries (domain, source, earliest_date, confidence, raw_data, error, queried_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const batch = results.map((r) =>
    stmt.bind(
      domain,
      r.source,
      r.earliest_date,
      r.confidence,
      JSON.stringify(r.raw_data),
      r.error ?? null,
      r.queried_at
    )
  );

  try {
    await env.DB.batch(batch);
  } catch (err) {
    console.error(`[Sources] Failed to store source results for ${domain}:`, err);
  }
}

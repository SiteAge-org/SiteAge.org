import type { Env } from "../env.js";
import { LOOKUP_CACHE_TTL } from "@siteage/shared";
import { queryCdx } from "./cdx.js";

export interface ArchaeologyResult {
  domain: string;
  birth_at: string | null;
  status: string;
  verification_status: string;
}

/**
 * Archaeology service: look up a domain's birth date.
 * Check flow: KV cache → D1 → CDX API → store → return
 */
export async function archaeologyService(env: Env, domain: string): Promise<ArchaeologyResult> {
  // 1. Check KV cache
  const cacheKey = `lookup:${domain}`;
  const cached = await env.API_CACHE.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Check D1
  const existing = await env.DB.prepare(
    "SELECT domain, birth_at, status, verification_status FROM domains WHERE domain = ?"
  ).bind(domain).first();

  if (existing) {
    const result: ArchaeologyResult = {
      domain: existing.domain as string,
      birth_at: existing.birth_at as string | null,
      status: existing.status as string,
      verification_status: existing.verification_status as string,
    };
    await env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: LOOKUP_CACHE_TTL });
    return result;
  }

  // 3. Query CDX API
  let birthAt: string | null = null;
  let status = "unknown";

  try {
    const cdxResult = await queryCdx(domain);

    // Store CDX audit record
    await env.DB.prepare(
      "INSERT INTO cdx_queries (domain, earliest_timestamp, snapshot_count) VALUES (?, ?, ?)"
    ).bind(domain, cdxResult.earliest_timestamp, cdxResult.snapshot_count).run();

    if (cdxResult.earliest_iso) {
      birthAt = cdxResult.earliest_iso;
      status = "active";
    }
  } catch (err) {
    console.error(`CDX query failed for ${domain}:`, err);
  }

  // 4. Insert into D1 (use INSERT OR IGNORE to handle concurrent requests)
  await env.DB.prepare(
    "INSERT OR IGNORE INTO domains (domain, birth_at, status) VALUES (?, ?, ?)"
  ).bind(domain, birthAt, status).run();

  // Re-query to get the actual stored record (may differ if another request won the race)
  const inserted = await env.DB.prepare(
    "SELECT domain, birth_at, status, verification_status FROM domains WHERE domain = ?"
  ).bind(domain).first();

  const result: ArchaeologyResult = {
    domain: inserted?.domain as string ?? domain,
    birth_at: inserted?.birth_at as string | null ?? birthAt,
    status: inserted?.status as string ?? status,
    verification_status: inserted?.verification_status as string ?? "detected",
  };

  // 5. Cache result
  await env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: LOOKUP_CACHE_TTL });

  return result;
}

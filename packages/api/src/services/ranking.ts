import type { Env } from "../env.js";
import { STATS_CACHE_TTL } from "@siteage/shared";

/**
 * Get the rank percentile for a domain based on its birth date.
 * Uses pre-computed percentile data from KV cache.
 */
export async function getRankPercentile(env: Env, birthAt: string): Promise<number | null> {
  const cached = await env.API_CACHE.get("stats:percentiles");
  if (!cached) return null;

  const percentiles = JSON.parse(cached) as number[]; // array of age_days at each percentile
  if (percentiles.length === 0) return null;

  const birth = new Date(birthAt);
  const now = new Date();
  const domainAgeDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  // Binary search: find position in percentile array
  let low = 0;
  let high = percentiles.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (percentiles[mid] <= domainAgeDays) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // low = number of percentile entries this domain is older than
  return Math.round((low / percentiles.length) * 100);
}

/**
 * Compute percentile data for all domains and store in KV.
 * Called by cron job every 6 hours.
 */
export async function updatePercentiles(env: Env): Promise<void> {
  const rows = await env.DB.prepare(
    `SELECT COALESCE(verified_birth_at, birth_at) as birth
     FROM domains
     WHERE birth_at IS NOT NULL AND status != 'dead'
     ORDER BY birth ASC`
  ).all();

  if (!rows.results || rows.results.length === 0) return;

  const now = new Date();
  const ageDaysArray = rows.results.map((row) => {
    const birth = new Date(row.birth as string);
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  });

  // Sort ascending (youngest to oldest)
  ageDaysArray.sort((a, b) => a - b);

  // Store 100 percentile markers (at 1%, 2%, ..., 100%)
  const percentiles: number[] = [];
  for (let i = 1; i <= 100; i++) {
    const idx = Math.min(Math.floor((i / 100) * ageDaysArray.length), ageDaysArray.length - 1);
    percentiles.push(ageDaysArray[idx]);
  }

  await env.API_CACHE.put("stats:percentiles", JSON.stringify(percentiles), {
    expirationTtl: STATS_CACHE_TTL,
  });
}

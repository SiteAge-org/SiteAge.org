import type { Env } from "../env.js";
import { STATS_CACHE_TTL } from "@siteage/shared";

/**
 * Update global stats snapshot in D1 and KV.
 */
export async function updateGlobalStats(env: Env): Promise<void> {
  const total = await env.DB.prepare("SELECT COUNT(*) as count FROM domains").first();
  const percentileRows = await env.DB.prepare(
    `SELECT COALESCE(verified_birth_at, birth_at) as birth
     FROM domains WHERE birth_at IS NOT NULL AND status != 'dead'
     ORDER BY birth ASC`
  ).all();

  const now = new Date();
  const ageDays = (percentileRows.results || []).map((r) => {
    const birth = new Date(r.birth as string);
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  });
  ageDays.sort((a, b) => a - b);

  const percentiles: number[] = [];
  for (let i = 1; i <= 100; i++) {
    const idx = Math.min(Math.floor((i / 100) * ageDays.length), ageDays.length - 1);
    percentiles.push(ageDays[idx] || 0);
  }

  const percentileData = JSON.stringify(percentiles);

  await env.DB.prepare(
    "INSERT INTO stats_snapshots (total_domains, percentile_data) VALUES (?, ?)"
  ).bind((total?.count as number) || 0, percentileData).run();

  // Also update KV cache for fast reads
  await env.API_CACHE.put("stats:percentiles", percentileData, { expirationTtl: STATS_CACHE_TTL });

  const stats = {
    total_domains: (total?.count as number) || 0,
  };
  await env.API_CACHE.put("stats:global", JSON.stringify(stats), { expirationTtl: STATS_CACHE_TTL });
}

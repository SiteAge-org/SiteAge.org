import type { Env } from "../env.js";
import { DAILY_CHECK_MIN, DAILY_CHECK_MAX, DAILY_CHECK_PERCENT, PRIORITY_POOL_RATIO } from "@siteage/shared";
import { checkDomain } from "../services/health-check.js";

/**
 * Run daily mixed health checks: 70% priority + 30% random.
 */
export async function runPriorityChecks(env: Env): Promise<void> {
  // Calculate daily quota
  const totalCount = await env.DB.prepare("SELECT COUNT(*) as count FROM domains").first();
  const total = (totalCount?.count as number) || 0;

  if (total === 0) return;

  const dailyQuota = Math.max(DAILY_CHECK_MIN, Math.min(Math.floor(total * DAILY_CHECK_PERCENT), DAILY_CHECK_MAX));
  const priorityCount = Math.floor(dailyQuota * PRIORITY_POOL_RATIO);
  const randomCount = dailyQuota - priorityCount;

  // Priority pool: scored by urgency
  const priorityRows = await env.DB.prepare(
    `SELECT id, domain FROM domains
     WHERE status != 'dead'
     ORDER BY
       CASE WHEN consecutive_failures BETWEEN 1 AND 2 THEN 1000 ELSE 0 END DESC,
       CASE WHEN badge_embedded = 1 AND last_checked_at < datetime('now', '-7 days') THEN 500 ELSE 0 END DESC,
       CASE WHEN verification_status = 'verified' AND last_checked_at < datetime('now', '-7 days') THEN 300
            WHEN consecutive_failures BETWEEN 3 AND 4 THEN 300 ELSE 0 END DESC,
       CASE WHEN last_checked_at IS NULL THEN 200 ELSE 0 END DESC,
       last_checked_at ASC NULLS FIRST
     LIMIT ?`
  ).bind(priorityCount).all();

  const priorityIds = new Set((priorityRows.results || []).map((r) => r.id as number));

  // Random pool: exclude priority domains
  const placeholders = priorityIds.size > 0 ? Array.from(priorityIds).join(",") : "0";
  const randomRows = await env.DB.prepare(
    `SELECT id, domain FROM domains
     WHERE status != 'dead' AND id NOT IN (${placeholders})
     ORDER BY RANDOM()
     LIMIT ?`
  ).bind(randomCount).all();

  // Combine and check all domains
  const allDomains = [
    ...(priorityRows.results || []).map((r) => ({ id: r.id as number, domain: r.domain as string, type: "priority" as const })),
    ...(randomRows.results || []).map((r) => ({ id: r.id as number, domain: r.domain as string, type: "random" as const })),
  ];

  console.log(`Health check: ${allDomains.length} domains (${priorityIds.size} priority, ${randomRows.results?.length || 0} random)`);

  // Process in batches of 10 to avoid overwhelming
  for (let i = 0; i < allDomains.length; i += 10) {
    const batch = allDomains.slice(i, i + 10);
    await Promise.allSettled(
      batch.map((d) => checkDomain(env, d.id, d.domain, d.type))
    );
  }
}

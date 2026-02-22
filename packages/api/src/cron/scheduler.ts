import type { Env } from "../env.js";
import { updatePercentiles } from "../services/ranking.js";
import { runPriorityChecks } from "./priority-check.js";
import { updateGlobalStats } from "./stats-update.js";

export async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const hour = new Date(event.scheduledTime).getUTCHours();

  if (hour === 3) {
    // Daily at 03:00 UTC: priority health checks
    ctx.waitUntil(runPriorityChecks(env));
  }

  if (hour % 6 === 0) {
    // Every 6 hours: update stats and percentiles
    ctx.waitUntil(updateGlobalStats(env));
    ctx.waitUntil(updatePercentiles(env));
  }
}

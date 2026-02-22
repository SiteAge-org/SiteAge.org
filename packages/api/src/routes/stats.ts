import { Hono } from "hono";
import type { Env } from "../env.js";
import { STATS_CACHE_TTL } from "@siteage/shared";
import type { GlobalStats } from "@siteage/shared";

export const statsRoutes = new Hono<{ Bindings: Env }>();

statsRoutes.get("/stats", async (c) => {
  // Check cache
  const cached = await c.env.API_CACHE.get("stats:global");
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Compute from D1
  const total = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains").first();
  const active = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'active'").first();
  const dead = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE status = 'dead'").first();
  const verified = await c.env.DB.prepare("SELECT COUNT(*) as count FROM domains WHERE verification_status = 'verified'").first();
  const oldest = await c.env.DB.prepare(
    "SELECT domain, COALESCE(verified_birth_at, birth_at) as birth FROM domains WHERE birth_at IS NOT NULL ORDER BY birth ASC LIMIT 1"
  ).first();

  const stats: GlobalStats = {
    total_domains: (total?.count as number) || 0,
    active_domains: (active?.count as number) || 0,
    dead_domains: (dead?.count as number) || 0,
    verified_domains: (verified?.count as number) || 0,
    oldest_domain: (oldest?.domain as string) || null,
    oldest_birth_at: (oldest?.birth as string) || null,
  };

  await c.env.API_CACHE.put("stats:global", JSON.stringify(stats), { expirationTtl: STATS_CACHE_TTL });

  return c.json(stats);
});

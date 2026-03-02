import { Hono } from "hono";
import type { Env } from "../env.js";

export const publicRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /sitemap-domains
 * Returns all active domains with birth dates for sitemap generation.
 * KV cached for 1 hour.
 */
publicRoutes.get("/sitemap-domains", async (c) => {
  const cacheKey = "public:sitemap-domains";
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const result = await c.env.DB.prepare(
    `SELECT domain, updated_at FROM domains
     WHERE status = 'active' AND (birth_at IS NOT NULL OR best_birth_at IS NOT NULL)
     ORDER BY created_at DESC`
  ).all();

  const data = {
    domains: (result.results || []).map((r: Record<string, unknown>) => ({
      domain: r.domain,
      updated_at: r.updated_at,
    })),
  };

  await c.env.API_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 3600,
  });

  return c.json(data);
});

/**
 * GET /browse
 * Returns paginated active domains for the browse page and homepage.
 * KV cached for 5 minutes.
 */
publicRoutes.get("/browse", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const cacheKey = `public:browse:${page}:${limit}`;
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const whereClause = "WHERE status = 'active' AND (birth_at IS NOT NULL OR best_birth_at IS NOT NULL)";

  const [countResult, domainsResult] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM domains ${whereClause}`).first(),
    c.env.DB.prepare(
      `SELECT domain, best_birth_at, verified_birth_at, birth_at, status, verification_status, created_at
       FROM domains ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all(),
  ]);

  const total = (countResult?.count as number) || 0;

  const data = {
    domains: (domainsResult.results || []).map((r: Record<string, unknown>) => ({
      domain: r.domain,
      best_birth_at: r.best_birth_at,
      verified_birth_at: r.verified_birth_at,
      birth_at: r.birth_at,
      status: r.status,
      verification_status: r.verification_status,
      created_at: r.created_at,
    })),
    total,
    page,
    limit,
  };

  await c.env.API_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 300,
  });

  return c.json(data);
});

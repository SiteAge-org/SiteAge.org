import { Hono } from "hono";
import type { Env } from "../env.js";
import { STATS_CACHE_TTL } from "@siteage/shared";

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
  const sort = c.req.query("sort") || "recent";
  const verifiedOnly = c.req.query("verified") === "true";

  const cacheKey = `public:browse:${page}:${limit}:${sort}:${verifiedOnly}`;
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  let whereClause = "WHERE status = 'active' AND (birth_at IS NOT NULL OR best_birth_at IS NOT NULL)";
  if (verifiedOnly) {
    whereClause += " AND verification_status = 'verified'";
  }

  let orderClause: string;
  switch (sort) {
    case "oldest":
      orderClause = "ORDER BY COALESCE(verified_birth_at, best_birth_at, birth_at) ASC";
      break;
    case "newest":
      orderClause = "ORDER BY COALESCE(verified_birth_at, best_birth_at, birth_at) DESC";
      break;
    default:
      orderClause = "ORDER BY created_at DESC";
  }

  const [countResult, domainsResult] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM domains ${whereClause}`).first(),
    c.env.DB.prepare(
      `SELECT domain, best_birth_at, verified_birth_at, birth_at, status, verification_status, created_at
       FROM domains ${whereClause}
       ${orderClause}
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

  // Shorter TTL for filtered requests to control cache key proliferation
  const cacheTtl = (sort !== "recent" || verifiedOnly) ? 120 : 300;
  await c.env.API_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: cacheTtl,
  });

  return c.json(data);
});

/**
 * GET /stats/distribution
 * Returns domain counts grouped by decade (1990s, 2000s, 2010s, 2020s).
 * KV cached for 1 hour.
 */
publicRoutes.get("/stats/distribution", async (c) => {
  const cacheKey = "public:stats:distribution";
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const decades = [
    { label: "1990s", start: "1990-01-01", end: "2000-01-01" },
    { label: "2000s", start: "2000-01-01", end: "2010-01-01" },
    { label: "2010s", start: "2010-01-01", end: "2020-01-01" },
    { label: "2020s", start: "2020-01-01", end: "2030-01-01" },
  ];

  const results = await Promise.all(
    decades.map(async (d) => {
      const row = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM domains
         WHERE status = 'active'
         AND COALESCE(verified_birth_at, best_birth_at, birth_at) >= ?
         AND COALESCE(verified_birth_at, best_birth_at, birth_at) < ?`
      )
        .bind(d.start, d.end)
        .first();
      return { decade: d.label, count: (row?.count as number) || 0 };
    })
  );

  const data = { distribution: results };

  await c.env.API_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: STATS_CACHE_TTL,
  });

  return c.json(data);
});

/**
 * GET /stats/top-oldest
 * Returns the N oldest domains by birth date.
 * KV cached for 1 hour.
 */
publicRoutes.get("/stats/top-oldest", async (c) => {
  const limit = Math.min(20, Math.max(1, parseInt(c.req.query("limit") || "10", 10)));

  const cacheKey = `public:stats:top-oldest:${limit}`;
  const cached = await c.env.API_CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const result = await c.env.DB.prepare(
    `SELECT domain, COALESCE(verified_birth_at, best_birth_at, birth_at) as birth_at,
            verification_status
     FROM domains
     WHERE status = 'active'
     AND (birth_at IS NOT NULL OR best_birth_at IS NOT NULL)
     ORDER BY COALESCE(verified_birth_at, best_birth_at, birth_at) ASC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  const data = {
    domains: (result.results || []).map((r: Record<string, unknown>) => ({
      domain: r.domain,
      birth_at: r.birth_at,
      verification_status: r.verification_status,
    })),
  };

  await c.env.API_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: STATS_CACHE_TTL,
  });

  return c.json(data);
});

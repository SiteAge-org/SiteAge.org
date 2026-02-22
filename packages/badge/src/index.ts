import { Hono } from "hono";
import { isValidDomain, BADGE_CACHE_TTL, DOMAIN_CACHE_TTL, API_BASE_URL } from "@siteage/shared";
import type { BadgeData, BadgeStyle } from "@siteage/shared";
import { renderBadge } from "./renderer.js";

interface Env {
  BADGE_CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/:domain{[a-z0-9.-]+\\.[a-z]{2,}}", async (c) => {
  const domain = c.req.param("domain");
  if (!isValidDomain(domain)) {
    return c.text("Invalid domain", 400);
  }

  const style = (c.req.query("style") || "flat") as BadgeStyle;
  const color = c.req.query("color");
  const label = c.req.query("label") || "SiteAge";
  const lang = c.req.query("lang") || "en";
  const logo = c.req.query("logo") !== "false";

  // 1. Check badge cache
  const cacheKey = `badge:${domain}:${style}:${color || "auto"}:${label}:${lang}`;
  const cached = await c.env.BADGE_CACHE.get(cacheKey);
  if (cached) {
    return c.body(cached, 200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    });
  }

  // 2. Get domain data (from KV or API)
  let data: BadgeData | null = null;
  const domainCacheKey = `domain:${domain}`;
  const domainCached = await c.env.BADGE_CACHE.get(domainCacheKey);

  if (domainCached) {
    data = JSON.parse(domainCached);
  } else {
    try {
      const resp = await fetch(`${API_BASE_URL}/${domain}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const detail = await resp.json() as Record<string, unknown>;
        data = {
          domain: detail.domain as string,
          birth_at: detail.birth_at as string | null,
          death_at: detail.death_at as string | null,
          status: detail.status as BadgeData["status"],
          verification_status: detail.verification_status as BadgeData["verification_status"],
          verified_birth_at: detail.verified_birth_at as string | null,
        };
        await c.env.BADGE_CACHE.put(domainCacheKey, JSON.stringify(data), {
          expirationTtl: DOMAIN_CACHE_TTL,
        });
      }
    } catch {
      // If API is down, render unknown badge
    }
  }

  // 3. Render SVG
  const svg = renderBadge({
    data: data || { domain, birth_at: null, death_at: null, status: "unknown", verification_status: "detected", verified_birth_at: null },
    style,
    overrideColor: color || undefined,
    label,
    lang,
    logo,
  });

  // 4. Cache and return
  await c.env.BADGE_CACHE.put(cacheKey, svg, { expirationTtl: BADGE_CACHE_TTL });

  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=300, s-maxage=86400",
  });
});

app.get("/", (c) => {
  return c.redirect("https://siteage.org", 301);
});

export default app;

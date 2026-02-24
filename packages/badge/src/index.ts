import { Hono } from "hono";
import { isValidDomain, BADGE_CACHE_TTL, DOMAIN_CACHE_TTL, API_BASE_URL, BADGE_MESSAGE_TYPES, BADGE_TIME_FORMATS } from "@siteage/shared";
import type { BadgeData, BadgeStyle, BadgeMessageType, BadgeTimeFormat } from "@siteage/shared";
import { renderBadge } from "./renderer.js";

interface Env {
  BADGE_CACHE: KVNamespace;
  API_URL?: string;
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
  const rawType = c.req.query("type");
  const type = rawType && (BADGE_MESSAGE_TYPES as readonly string[]).includes(rawType)
    ? (rawType as BadgeMessageType)
    : undefined;
  const rawFormat = c.req.query("format");
  const format = rawFormat && (BADGE_TIME_FORMATS as readonly string[]).includes(rawFormat)
    ? (rawFormat as BadgeTimeFormat)
    : undefined;

  // 1. Check badge cache
  const cacheKey = `badge:${domain}:${style}:${color || "auto"}:${label}:${type || "default"}:${format || "default"}`;
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
      const apiBase = c.env.API_URL || API_BASE_URL;
      const resp = await fetch(`${apiBase}/${domain}`, {
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
    } catch (err) {
      console.error(`[Badge] Failed to fetch domain data for ${domain}:`, err);
    }
  }

  // 3. Render SVG
  const svg = renderBadge({
    data: data || { domain, birth_at: null, death_at: null, status: "unknown", verification_status: "detected", verified_birth_at: null },
    style,
    overrideColor: color || undefined,
    label,
    type,
    format,
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

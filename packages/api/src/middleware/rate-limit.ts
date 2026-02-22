import { createMiddleware } from "hono/factory";
import type { Env } from "../env.js";
import { RATE_LIMIT_TTL, RATE_LIMIT_MAX } from "@siteage/shared";

export function rateLimit() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const key = `ratelimit:${ip}`;

    const current = await c.env.API_CACHE.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= RATE_LIMIT_MAX) {
      return c.json(
        { error: "rate_limited", message: "Too many requests. Please try again later." },
        429
      );
    }

    await c.env.API_CACHE.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_TTL });

    c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    c.header("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - count - 1));

    await next();
  });
}

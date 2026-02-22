import { createMiddleware } from "hono/factory";
import type { Env } from "../env.js";

export function cors() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const origin = c.req.header("Origin") || "*";
    const allowedOrigins = [
      "https://siteage.org",
      "https://www.siteage.org",
      "http://localhost:4321",
      "http://localhost:3000",
    ];

    const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    c.header("Access-Control-Allow-Origin", allowOrigin);
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
    c.header("Access-Control-Max-Age", "86400");

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    await next();
  });
}

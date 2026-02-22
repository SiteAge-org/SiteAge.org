import { Hono } from "hono";
import type { Env } from "../env.js";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// Admin authentication middleware
adminRoutes.use("*", async (c, next) => {
  const adminKey = c.req.header("X-Admin-Key");
  if (!adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: "unauthorized", message: "Invalid admin key" }, 401);
  }
  await next();
});

// GET /admin/dashboard
adminRoutes.get("/dashboard", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 7" }, 501);
});

// GET /admin/evidence
adminRoutes.get("/evidence", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 7" }, 501);
});

// POST /admin/evidence/:id/review
adminRoutes.post("/evidence/:id/review", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 7" }, 501);
});

// GET /admin/domains
adminRoutes.get("/domains", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 7" }, 501);
});

// POST /admin/domains/:id
adminRoutes.post("/domains/:id", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 7" }, 501);
});

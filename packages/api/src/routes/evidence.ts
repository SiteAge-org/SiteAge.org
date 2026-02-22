import { Hono } from "hono";
import type { Env } from "../env.js";

export const evidenceRoutes = new Hono<{ Bindings: Env }>();

// POST /evidence/submit - Submit evidence for earlier birth date
evidenceRoutes.post("/submit", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 5" }, 501);
});

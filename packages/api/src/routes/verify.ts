import { Hono } from "hono";
import type { Env } from "../env.js";

export const verifyRoutes = new Hono<{ Bindings: Env }>();

// POST /verify/init - Initialize verification
verifyRoutes.post("/init", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 5" }, 501);
});

// POST /verify/check - Check verification status
verifyRoutes.post("/check", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 5" }, 501);
});

// POST /verify/resend - Resend Magic Link
verifyRoutes.post("/resend", async (c) => {
  return c.json({ error: "not_implemented", message: "Coming in Step 5" }, 501);
});

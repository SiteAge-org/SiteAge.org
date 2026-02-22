import { Hono } from "hono";
import type { Env } from "./env.js";
import { cors } from "./middleware/cors.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { lookupRoutes } from "./routes/lookup.js";
import { domainRoutes } from "./routes/domain.js";
import { verifyRoutes } from "./routes/verify.js";
import { evidenceRoutes } from "./routes/evidence.js";
import { statsRoutes } from "./routes/stats.js";
import { manageRoutes } from "./routes/manage.js";
import { adminRoutes } from "./routes/admin.js";
import { handleScheduled } from "./cron/scheduler.js";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.use("*", rateLimit());

app.route("/", lookupRoutes);
app.route("/", domainRoutes);
app.route("/verify", verifyRoutes);
app.route("/evidence", evidenceRoutes);
app.route("/", statsRoutes);
app.route("/manage", manageRoutes);
app.route("/admin", adminRoutes);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.notFound((c) => c.json({ error: "not_found", message: "Route not found" }, 404));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "internal_error", message: "Internal server error" }, 500);
});

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};

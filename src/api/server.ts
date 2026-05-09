// ============================================================
// src/api/server.ts — Express server setup
// ============================================================

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getRedisClient, closeRedis } from "../services/redisClient.js";
import {
  initializeSearchQueue,
  createSearchWorker,
} from "../services/deepSearchEngine.js";
import searchRoute from "./routes/search.js";
import cacheRoute from "./routes/cache.js";
import statsRoute from "./routes/stats.js";
import searchesRoute from "./routes/searches.js";
import reportsRoute from "./routes/reports.js";
import analyticsRoute from "./routes/analytics.js";
import userRoute from "./routes/user.js";
import logger from "../utils/logger.js";
import config from "../config/index.js";

export async function buildServer() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: config.nodeEnv === "development" ? true : ["https://yourapp.com"],
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
    }),
  );

  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      keyGenerator: (req: Request) =>
        req.ip ?? req.socket.remoteAddress ?? "unknown",
      handler: (_req, res) =>
        res.status(429).json({
          code: 429,
          error: "Too Many Requests",
          message: "Rate limit exceeded. Retry later.",
          date: Date.now(),
        }),
    }),
  );

  // ── Initialize Deep Search Engine ────────────────────────────
  initializeSearchQueue();
  createSearchWorker();

  // ── Health Endpoint ───────────────────────────────────────────
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Deep Research Engine",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: {
        search: "POST /search",
        jobStatus: "GET /search/job/:jobId/status",
        jobResult: "GET /search/job/:jobId/result",
        health: "GET /health",
        cacheStats: "GET /api/v1/cache/stats",
        clearCache: "DELETE /api/v1/cache/:query",
        homepageStats: "GET /api/v1/stats/homepage",
        latestSearches: "GET /api/v1/searches/latest",
        searchSuggestions: "GET /api/v1/search/suggestions",
        trendingSearches: "GET /api/v1/searches/trending",
        reportProgress: "GET /api/v1/reports/:id/progress",
        savedReports: "GET /api/v1/reports/saved",
        dashboardAnalytics: "GET /api/v1/analytics/dashboard",
        subscriptionStatus: "GET /api/v1/subscription/status",
        creditUsage: "GET /api/v1/credits/usage",
      },
    });
  });

  app.get("/health", async (_req: Request, res: Response) => {
    let redisStatus = "ok";
    try {
      await getRedisClient().ping();
    } catch {
      redisStatus = "unavailable";
    }
    res.json({
      status: "ok",
      redis: redisStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Register Routes ───────────────────────────────────────────
  app.use("/api/v1", searchRoute);
  app.use("/api/v1", cacheRoute);
  app.use("/api/v1", statsRoute);
  app.use("/api/v1", searchesRoute);
  app.use("/api/v1", reportsRoute);
  app.use("/api/v1", analyticsRoute);
  app.use("/api/v1", userRoute);

  // ── 404 Handler ───────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: "Route not found",
    });
  });

  // ── Global Error Handler ──────────────────────────────────────
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err: error }, "Unhandled error");
    const statusCode = (error as any).statusCode ?? 500;
    res.status(statusCode).json({
      error: error.name || "InternalServerError",
      message: error.message || "An unexpected error occurred",
      statusCode,
    });
  });

  // ── Graceful Shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal");
    await closeRedis();
    logger.info("Server shut down gracefully");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return app;
}

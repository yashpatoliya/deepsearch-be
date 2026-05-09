// ============================================================
// src/api/routes/cache.ts — Cache management routes
// ============================================================

import { Router, Request, Response } from "express";
import {
  getRedisClient,
  cacheDelete,
  buildQueryCacheKey,
} from "../../services/redisClient.js";
import logger from "../../utils/logger.js";

const router = Router();

router.delete("/cache/:query", async (req: Request, res: Response) => {
  const { query } = req.params;
  const cacheKey = buildQueryCacheKey(decodeURIComponent(query));
  await cacheDelete(cacheKey);
  logger.info({ query }, "Cache: invalidated");
  return res.json({ success: true, message: `Cache cleared for: ${query}` });
});

router.get("/cache/stats", async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const info = await redis.info("stats");
    const keyspace = await redis.info("keyspace");
    const memory = await redis.info("memory");

    const parseInfo = (raw: string): Record<string, string> => {
      return raw
        .split("\n")
        .filter((l) => l.includes(":") && !l.startsWith("#"))
        .reduce(
          (acc, line) => {
            const [k, v] = line.split(":");
            if (k && v) acc[k.trim()] = v.trim();
            return acc;
          },
          {} as Record<string, string>,
        );
    };

    return res.json({
      stats: parseInfo(info),
      keyspace: parseInfo(keyspace),
      memory: parseInfo(memory),
    });
  } catch (err) {
    logger.error({ err }, "Cache: stats fetch failed");
    return res.status(503).json({ error: "Redis unavailable" });
  }
});

export default router;

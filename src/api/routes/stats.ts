// ============================================================
// src/api/routes/stats.ts — Statistics and analytics routes
// ============================================================

import { Router, Request, Response } from "express";
import logger from "../../utils/logger.js";

const router = Router();

router.get("/stats/homepage", async (_req: Request, res: Response) => {
  try {
    const stats = {
      totalSearches: 0,
      activeUsers: 0,
      recentActivity: 0,
      timestamp: new Date().toISOString(),
    };

    logger.info("Stats: homepage stats requested");
    return res.json(stats);
  } catch (err) {
    logger.error({ err }, "Stats: homepage fetch failed");
    return res.status(500).json({ error: "Failed to fetch homepage stats" });
  }
});

export default router;

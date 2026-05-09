// ============================================================
// src/api/routes/analytics.ts — Analytics routes
// ============================================================

import { Router, Request, Response } from "express";
import logger from "../../utils/logger.js";

const router = Router();

router.get("/analytics/dashboard", async (_req: Request, res: Response) => {
  try {
    const userId = "mock-user";
    const analytics = {
      searches: {
        total: 45,
        thisMonth: 23,
        lastMonth: 22,
        trend: 4.5,
      },
      reports: {
        total: 12,
        completed: 10,
        inProgress: 2,
      },
      credits: {
        used: 150,
        remaining: 850,
        monthlyLimit: 1000,
      },
      activity: [
        { date: "2024-01-01", searches: 5, reports: 1 },
        { date: "2024-01-02", searches: 3, reports: 0 },
      ],
    };

    logger.info({ userId }, "Analytics: dashboard requested");
    return res.json(analytics);
  } catch (err) {
    logger.error({ err }, "Analytics: dashboard fetch failed");
    return res
      .status(500)
      .json({ error: "Failed to fetch dashboard analytics" });
  }
});

export default router;

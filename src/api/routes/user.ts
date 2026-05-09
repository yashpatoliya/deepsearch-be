// ============================================================
// src/api/routes/user.ts — User-related routes
// ============================================================

import { Router, Request, Response } from "express";
import logger from "../../utils/logger.js";

const router = Router();

router.get("/subscription/status", async (_req: Request, res: Response) => {
  try {
    const userId = "mock-user";
    const subscription = {
      plan: "basic",
      status: "active",
      currentPeriodStart: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      cancelAtPeriodEnd: false,
    };

    logger.info({ userId }, "User: subscription status requested");
    return res.json(subscription);
  } catch (err) {
    logger.error({ err }, "User: subscription status fetch failed");
    return res
      .status(500)
      .json({ error: "Failed to fetch subscription status" });
  }
});

router.get("/credits/usage", async (_req: Request, res: Response) => {
  try {
    const userId = "mock-user";
    const creditUsage = {
      current: 850,
      used: 150,
      limit: 1000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      history: [
        {
          date: new Date().toISOString(),
          amount: -10,
          action: "search",
          description: "Deep search query",
        },
        {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          amount: -25,
          action: "report",
          description: "Report generation",
        },
      ],
    };

    logger.info({ userId }, "User: credit usage requested");
    return res.json(creditUsage);
  } catch (err) {
    logger.error({ err }, "User: credit usage fetch failed");
    return res.status(500).json({ error: "Failed to fetch credit usage" });
  }
});

export default router;

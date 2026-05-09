// ============================================================
// src/api/routes/reports.ts — Report management routes
// ============================================================

import { Router, Request, Response } from "express";
import logger from "../../utils/logger.js";

const router = Router();

router.get("/reports/:id/progress", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const progress = {
      id,
      status: "processing",
      progress: 65,
      message: "Analyzing sources...",
      estimatedTimeRemaining: 45,
    };

    logger.info({ reportId: id }, "Reports: progress requested");
    return res.json(progress);
  } catch (err) {
    logger.error({ err, reportId: id }, "Reports: progress fetch failed");
    return res.status(500).json({ error: "Failed to fetch report progress" });
  }
});

router.get("/reports/saved", async (_req: Request, res: Response) => {
  try {
    const userId = "mock-user";
    const savedReports = [
      {
        id: "1",
        title: "AI Market Analysis Report",
        query: "AI market trends",
        createdAt: new Date().toISOString(),
        status: "completed",
        fileUrl: "/downloads/report-1.pdf",
      },
    ];

    logger.info({ userId }, "Reports: saved requested");
    return res.json(savedReports);
  } catch (err) {
    logger.error({ err }, "Reports: saved fetch failed");
    return res.status(500).json({ error: "Failed to fetch saved reports" });
  }
});

export default router;

// ============================================================
// src/api/routes/searches.ts — Search-related routes
// ============================================================

import { Router, Request, Response } from "express";
import { z } from "zod";
import logger from "../../utils/logger.js";

const SuggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100).trim(),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

type SuggestionsQuery = z.infer<typeof SuggestionsQuerySchema>;

const router = Router();

router.get("/searches/latest", async (_req: Request, res: Response) => {
  try {
    const userId = "mock-user";
    const latestSearches = [
      {
        id: "1",
        query: "Recent search example",
        timestamp: new Date().toISOString(),
        status: "completed",
      },
    ];

    logger.info({ userId }, "Searches: latest requested");
    return res.json(latestSearches);
  } catch (err) {
    logger.error({ err }, "Searches: latest fetch failed");
    return res.status(500).json({ error: "Failed to fetch latest searches" });
  }
});

router.get("/search/suggestions", async (req: Request, res: Response) => {
  const parseResult = SuggestionsQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parseResult.error.errors.map((e) => e.message).join(", "),
    });
  }

  const { q, limit } = parseResult.data;

  try {
    const suggestions = [`${q} results`, `${q} analysis`, `${q} trends`].slice(
      0,
      limit,
    );

    logger.info({ query: q, limit }, "Search: suggestions requested");
    return res.json(suggestions);
  } catch (err) {
    logger.error({ err, query: q }, "Search: suggestions failed");
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

router.get("/searches/trending", async (_req: Request, res: Response) => {
  try {
    const trending = [
      { query: "AI trends", count: 150, trend: "up" },
      { query: "Market analysis", count: 120, trend: "stable" },
    ];

    logger.info("Searches: trending requested");
    return res.json(trending);
  } catch (err) {
    logger.error({ err }, "Searches: trending fetch failed");
    return res.status(500).json({ error: "Failed to fetch trending searches" });
  }
});

export default router;

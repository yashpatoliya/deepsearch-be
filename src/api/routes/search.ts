import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  createSearchJob,
  getJobStatus,
  getJobResult,
} from "../../services/deepSearchEngine.js";
import logger from "../../utils/logger.js";

const router = Router();

const SearchBodySchema = z.object({
  query: z.string().min(2).max(200).trim(),
  search_type: z
    .enum([
      "full_name",
      "username",
      "email",
      "phone",
      "city",
      "company",
      "social_handle",
    ])
    .optional()
    .default("full_name"),
  deep_mode: z.boolean().optional().default(true),
  max_results: z.number().int().min(1).max(50).optional().default(20),
  context_query: z.string().max(200).optional(),
  categories: z
    .array(
      z.enum([
        "social_media",
        "photos",
        "videos",
        "web_mentions",
        "education",
        "professional",
        "dating_profiles",
        "family_relations",
        "business_profiles",
        "location_history",
        "public_documents",
        "news_mentions",
      ]),
    )
    .optional()
    .default(["social_media", "web_mentions", "professional"]),
});

type SearchBody = z.infer<typeof SearchBodySchema>;

router.post("/search", async (req: Request, res: Response) => {
  try {
    const parseResult = SearchBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.errors.map((e) => e.message).join("; "),
      });
    }

    const data = parseResult.data;
    logger.info(
      {
        query: data.query,
        searchType: data.search_type,
        categories: data.categories,
      },
      "API: search job created",
    );

    const job = await createSearchJob({
      query: data.query,
      searchType: data.search_type,
      categories: data.categories,
      maxResults: data.max_results,
      deepMode: data.deep_mode,
      contextQuery: data.context_query,
    });

    return res.status(200).json({
      jobId: job.id,
      status: job.status,
      message: "Search job created successfully",
      estimatedTime: 120,
    });
  } catch (err) {
    logger.error({ err }, "API: search job creation failed");
    return res.status(500).json({
      error: "Search job creation failed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

router.get("/search/job/:jobId/status", async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const job = await getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
        message: `No job found with ID: ${jobId}`,
      });
    }

    const progress =
      job.status === "completed"
        ? 100
        : job.status === "failed"
          ? 0
          : Math.floor(Math.random() * 80) + 10;

    return res.json({
      jobId: job.id,
      status: job.status,
      progress,
      message: `Status: ${job.status}`,
    });
  } catch (err) {
    logger.error({ err }, "API: job status fetch failed");
    return res.status(500).json({
      error: "Failed to fetch job status",
    });
  }
});

router.get("/search/job/:jobId/result", async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const report = await getJobResult(jobId);

    if (!report) {
      return res.status(404).json({
        error: "Result not found",
        message: `No result for job ID: ${jobId}`,
      });
    }

    return res.json(report);
  } catch (err) {
    logger.error({ err }, "API: job result fetch failed");
    return res.status(500).json({
      error: "Failed to fetch job result",
    });
  }
});

router.get("/search/health", (_req: Request, res: Response) => {
  return res.json({ status: "ok" });
});

export default router;

// ============================================================
// src/workers/scrapeWorker.ts — BullMQ worker for scraping jobs
// ============================================================

import { Worker, type Job } from 'bullmq';
import { getRedisClient } from '../services/redisClient.js';
import { scrapeWithCheerio } from '../modules/scraper/cheerioScraper.js';
import { cacheSet, buildPageCacheKey } from '../services/redisClient.js';
import type { ScrapeJobData, ScrapedPage } from '../types/index.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export const SCRAPE_QUEUE_NAME = 'scrape-queue';

/**
 * Process a single URL scraping job.
 */
async function processScrapeJob(job: Job<ScrapeJobData>): Promise<ScrapedPage> {
  const { url, query, jobId } = job.data;
  logger.info({ jobId, url, query }, 'Worker: processing scrape job');

  const page = await scrapeWithCheerio(url);

  if (page.success && page.content.length > 100) {
    const cacheKey = buildPageCacheKey(url);
    await cacheSet(cacheKey, page, config.cache.pageTtlSeconds);
    logger.info({ jobId, url, contentLen: page.content.length }, 'Worker: job complete');
  } else {
    logger.warn({ jobId, url, error: page.error }, 'Worker: job returned no content');
  }

  return page;
}

/**
 * Create and start the scrape worker.
 * This should be run in a separate process for production.
 */
export function createScrapeWorker(): Worker<ScrapeJobData, ScrapedPage> {
  const connection = getRedisClient();

  const worker = new Worker<ScrapeJobData, ScrapedPage>(
    SCRAPE_QUEUE_NAME,
    processScrapeJob,
    {
      connection,
      concurrency: config.queue.concurrency,
    }
  );

  worker.on('completed', (job, result) => {
    logger.debug({ jobId: job.id, url: job.data.url }, 'Worker: job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, url: job?.data.url, err }, 'Worker: job failed');
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker: error');
  });

  logger.info({ concurrency: config.queue.concurrency }, 'Worker: scrape worker started');
  return worker;
}

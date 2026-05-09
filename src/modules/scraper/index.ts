// ============================================================
// src/modules/scraper/index.ts — Scraper orchestrator + dedup
// ============================================================

import pLimit from 'p-limit';
import type { ScrapedPage } from '../../types/index.js';
import { scrapeWithCheerio } from './cheerioScraper.js';
import { cacheGet, cacheSet, buildPageCacheKey } from '../../services/redisClient.js';
import { tokenize, cosineSimilarity } from '../../utils/textUtils.js';
import { isSsrfSafe } from '../../utils/urlUtils.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';

const SIMILARITY_THRESHOLD = 0.85; // Pages above this score are duplicates

/**
 * Scrape multiple URLs in parallel with concurrency control.
 * Returns deduplicated, non-empty pages.
 */
export async function scrapeUrls(urls: string[]): Promise<ScrapedPage[]> {
  const safeUrls = urls.filter(isSsrfSafe).slice(0, config.scraper.maxUrls);
  logger.info({ count: safeUrls.length }, 'Scraper: starting batch scrape');

  const limit = pLimit(config.queue.concurrency);
  const startTime = Date.now();

  const results = await Promise.all(
    safeUrls.map((url) =>
      limit(async () => {
        // Check page cache first
        const cacheKey = buildPageCacheKey(url);
        const cached = await cacheGet<ScrapedPage>(cacheKey);
        if (cached) {
          logger.debug({ url }, 'Scraper: page cache hit');
          return { ...cached, fromCache: true };
        }

        // Scrape the page
        const page = await scrapeWithCheerio(url);

        // Cache successful scrapes
        if (page.success && page.content.length > 100) {
          await cacheSet(cacheKey, page, config.cache.pageTtlSeconds);
        }

        return page;
      })
    )
  );

  // Filter successful results
  const successful = results.filter((p) => p.success && p.content.length > 100);

  // Deduplicate by content similarity
  const deduplicated = deduplicateByContent(successful);

  logger.info(
    {
      total: safeUrls.length,
      successful: successful.length,
      deduplicated: deduplicated.length,
      ms: Date.now() - startTime,
    },
    'Scraper: batch complete'
  );

  return deduplicated;
}

/**
 * Remove pages with highly similar content (near-duplicate articles).
 */
function deduplicateByContent(pages: ScrapedPage[]): ScrapedPage[] {
  const result: ScrapedPage[] = [];
  const tokenizedPages: string[][] = [];

  for (const page of pages) {
    const tokens = tokenize(page.content.slice(0, 1000));
    let isDuplicate = false;

    for (let i = 0; i < result.length; i++) {
      const similarity = cosineSimilarity(tokens, tokenizedPages[i]!);
      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        logger.debug(
          { url: page.url, duplicateOf: result[i]!.url, similarity },
          'Scraper: duplicate detected'
        );
        break;
      }
    }

    if (!isDuplicate) {
      result.push(page);
      tokenizedPages.push(tokens);
    }
  }

  return result;
}

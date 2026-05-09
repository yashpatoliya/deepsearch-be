// ============================================================
// src/services/researchEngine.ts — Core research orchestrator
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { ResearchResponse, Article, Profile } from '../types/index.js';
import { runSearch } from '../modules/search/index.js';
import { scrapeUrls } from '../modules/scraper/index.js';
import { rankResults } from '../modules/ranking/index.js';
import { generateSummary } from '../modules/ai/summarizer.js';
import { extractKeywords } from '../modules/ai/tfidf.js';
import {
  extractProfilesFromUrls,
  extractProfilesFromContent,
} from '../modules/ai/entityExtractor.js';
import {
  cacheGet,
  cacheSet,
  buildQueryCacheKey,
} from './redisClient.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export interface ResearchOptions {
  deepMode?: boolean;
  maxResults?: number;
  useCache?: boolean;
  contextQuery?: string; // For follow-up queries
}

/**
 * Main research engine — orchestrates search → scrape → rank → summarize.
 */
export async function runResearch(
  query: string,
  options: ResearchOptions = {}
): Promise<ResearchResponse> {
  const {
    deepMode = false,
    maxResults = 10,
    useCache = true,
    contextQuery,
  } = options;

  const startTime = Date.now();
  const requestId = uuidv4();
  const effectiveQuery = contextQuery ? `${contextQuery} ${query}` : query;

  logger.info({ requestId, query, deepMode, effectiveQuery }, 'Research: starting');

  // ── 1. Check cache ──────────────────────────────────────────
  if (useCache) {
    const cacheKey = buildQueryCacheKey(effectiveQuery);
    const cached = await cacheGet<ResearchResponse>(cacheKey);
    if (cached) {
      logger.info({ requestId, query }, 'Research: cache hit');
      return {
        ...cached,
        meta: { ...cached.meta, fromCache: true, cachedAt: cached.meta.cachedAt },
      };
    }
  }

  // ── 2. Search ────────────────────────────────────────────────
  const searchResults = await runSearch(effectiveQuery, { deepMode });

  if (searchResults.length === 0) {
    logger.warn({ requestId, query }, 'Research: no search results found');
    return buildEmptyResponse(query, startTime);
  }

  // ── 3. Scrape ────────────────────────────────────────────────
  const urlsToScrape = searchResults
    .slice(0, config.scraper.maxUrls)
    .map((r) => r.url);

  const scrapedPages = await scrapeUrls(urlsToScrape);

  // ── 4. Rank ──────────────────────────────────────────────────
  const rankedResults = rankResults(effectiveQuery, searchResults, scrapedPages);

  // ── 5. Extract profiles ──────────────────────────────────────
  const allUrls = searchResults.map((r) => r.url);
  const profilesFromUrls = extractProfilesFromUrls(allUrls);

  // Also search page content for profile links
  const profilesFromContent: Profile[] = [];
  for (const page of scrapedPages.slice(0, 5)) {
    const found = extractProfilesFromContent(page.content, page.url);
    profilesFromContent.push(...found);
  }

  // Merge and deduplicate profiles
  const allProfiles = deduplicateProfiles([
    ...profilesFromUrls,
    ...profilesFromContent,
  ]);

  // ── 6. Generate summary ──────────────────────────────────────
  const topContents = rankedResults
    .slice(0, 10)
    .map((r) => r.content)
    .filter((c) => c.length > 100);

  const { summary, keyPoints } = generateSummary(effectiveQuery, topContents);

  // ── 7. Keywords ──────────────────────────────────────────────
  const keywords = extractKeywords(topContents, 10).map((k) => k.term);

  // ── 8. Build articles list ───────────────────────────────────
  const articles: Article[] = rankedResults
    .filter(
      (r) =>
        !allProfiles.some((p) => p.url === r.url) && r.content.length > 50
    )
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title || r.domain,
      url: r.url,
      snippet:
        r.snippet ||
        r.content.slice(0, 200).replace(/\s+/g, ' ').trim() + '...',
      score: r.score,
      publishedDate: r.publishedDate,
    }));

  // ── 9. Sources ───────────────────────────────────────────────
  const sources = [
    ...new Set([
      ...articles.map((a) => a.url),
      ...allProfiles.map((p) => p.url),
    ]),
  ].slice(0, 20);

  const processingTimeMs = Date.now() - startTime;

  const response: ResearchResponse = {
    query,
    summary: summary || `Research results for: ${query}`,
    key_points: keyPoints.length > 0 ? keyPoints : keywords.slice(0, 5),
    profiles: allProfiles.slice(0, 10),
    articles,
    sources,
    meta: {
      totalResults: rankedResults.length,
      processingTimeMs,
      fromCache: false,
      cachedAt: new Date().toISOString(),
    },
  };

  // ── 10. Cache result ─────────────────────────────────────────
  if (useCache) {
    const cacheKey = buildQueryCacheKey(effectiveQuery);
    await cacheSet(cacheKey, response, config.cache.ttlSeconds);
  }

  logger.info(
    { requestId, query, processingTimeMs, articles: articles.length },
    'Research: complete'
  );

  return response;
}

function buildEmptyResponse(query: string, startTime: number): ResearchResponse {
  return {
    query,
    summary: `No results found for: ${query}`,
    key_points: [],
    profiles: [],
    articles: [],
    sources: [],
    meta: {
      totalResults: 0,
      processingTimeMs: Date.now() - startTime,
      fromCache: false,
    },
  };
}

function deduplicateProfiles(profiles: Profile[]): Profile[] {
  const seen = new Set<string>();
  return profiles.filter((p) => {
    const key = `${p.platform}:${p.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

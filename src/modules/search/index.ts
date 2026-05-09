// ============================================================
// src/modules/search/index.ts — Search orchestrator
// ============================================================

import type { SearchResult } from '../../types/index.js';
import { searchDuckDuckGo } from './duckduckgo.js';
import { isSsrfSafe, isBlockedDomain } from '../../utils/urlUtils.js';
import logger from '../../utils/logger.js';

export interface SearchOptions {
  deepMode?: boolean; // Run additional search passes
}

/**
 * Run search across all available free search sources,
 * deduplicate and filter results, then return clean list.
 */
export async function runSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Primary: DuckDuckGo HTML
  const ddgResults = await searchDuckDuckGo(query);
  for (const r of ddgResults) {
    if (!seenUrls.has(r.url) && isSsrfSafe(r.url) && !isBlockedDomain(r.url)) {
      seenUrls.add(r.url);
      allResults.push(r);
    }
  }

  // Deep mode: run additional passes with refined queries
  if (options.deepMode && allResults.length > 0) {
    const deepQueries = generateDeepQueries(query);
    for (const dq of deepQueries.slice(0, 2)) {
      const deepResults = await searchDuckDuckGo(dq);
      for (const r of deepResults) {
        if (!seenUrls.has(r.url) && isSsrfSafe(r.url) && !isBlockedDomain(r.url)) {
          seenUrls.add(r.url);
          allResults.push({ ...r, snippet: `[Deep] ${r.snippet}` });
        }
      }
    }
    logger.info({ query, deepMode: true, total: allResults.length }, 'Search: deep mode complete');
  }

  logger.info({ query, total: allResults.length }, 'Search: orchestration complete');
  return allResults;
}

/**
 * Generate refined sub-queries for deep search mode.
 */
function generateDeepQueries(query: string): string[] {
  return [
    `${query} biography background`,
    `${query} latest news 2024 2025`,
    `${query} career achievements`,
    `who is ${query}`,
  ];
}

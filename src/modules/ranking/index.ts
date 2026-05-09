// ============================================================
// src/modules/ranking/index.ts — Result ranking engine
// ============================================================

import type { ScrapedPage, SearchResult, RankedResult } from '../../types/index.js';
import { isCredibleDomain, extractDomain } from '../../utils/urlUtils.js';
import { scoreTextRelevance } from '../ai/tfidf.js';
import { tokenize } from '../../utils/textUtils.js';
import logger from '../../utils/logger.js';

interface RankingWeights {
  queryRelevance: number;
  contentLength: number;
  domainCredibility: number;
  recency: number;
  snippetMatch: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  queryRelevance: 0.40,
  contentLength: 0.15,
  domainCredibility: 0.25,
  recency: 0.10,
  snippetMatch: 0.10,
};

/**
 * Parse a date string and return a recency score (0-1, 1 = today).
 */
function computeRecencyScore(dateStr?: string): number {
  if (!dateStr) return 0.3; // neutral score if no date
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 0.3;
    const ageMs = Date.now() - date.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    // Score decays: today=1, 7 days=0.8, 30 days=0.5, 365 days=0.1
    if (ageDays < 1) return 1.0;
    if (ageDays < 7) return 0.85;
    if (ageDays < 30) return 0.65;
    if (ageDays < 90) return 0.45;
    if (ageDays < 365) return 0.25;
    return 0.1;
  } catch {
    return 0.3;
  }
}

/**
 * Compute content length score (normalized).
 */
function computeLengthScore(content: string): number {
  const len = content.length;
  if (len < 100) return 0.1;
  if (len < 500) return 0.3;
  if (len < 1000) return 0.5;
  if (len < 3000) return 0.75;
  if (len < 6000) return 0.9;
  return 1.0;
}

/**
 * Rank and merge search results with scraped content.
 */
export function rankResults(
  query: string,
  searchResults: SearchResult[],
  scrapedPages: ScrapedPage[],
  weights: RankingWeights = DEFAULT_WEIGHTS
): RankedResult[] {
  const queryTerms = tokenize(query);
  const pageMap = new Map<string, ScrapedPage>();
  for (const page of scrapedPages) {
    pageMap.set(page.url, page);
  }

  const ranked: RankedResult[] = [];

  for (const result of searchResults) {
    const page = pageMap.get(result.url);
    const content = page?.content ?? result.snippet ?? '';

    // 1. Query relevance score
    const relevanceScore = scoreTextRelevance(
      `${result.title} ${content}`,
      queryTerms
    );

    // 2. Content length score
    const lengthScore = computeLengthScore(content);

    // 3. Domain credibility score
    const credibilityScore = isCredibleDomain(result.url) ? 1.0 : 0.4;

    // 4. Recency score
    const recencyScore = computeRecencyScore(page?.publishedDate);

    // 5. Snippet match score
    const snippetScore = scoreTextRelevance(result.snippet, queryTerms);

    // Composite score
    const finalScore =
      relevanceScore * weights.queryRelevance +
      lengthScore * weights.contentLength +
      credibilityScore * weights.domainCredibility +
      recencyScore * weights.recency +
      snippetScore * weights.snippetMatch;

    ranked.push({
      url: result.url,
      title: page?.title || result.title,
      snippet: result.snippet,
      content,
      score: Math.round(finalScore * 1000) / 1000,
      domain: extractDomain(result.url),
      publishedDate: page?.publishedDate,
    });
  }

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);

  logger.debug({ query, count: ranked.length }, 'Ranking: complete');
  return ranked;
}

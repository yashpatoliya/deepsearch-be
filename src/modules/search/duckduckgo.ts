// ============================================================
// src/modules/search/duckduckgo.ts — DuckDuckGo scraper
// ============================================================

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SearchResult } from '../../types/index.js';
import { normalizeUrl, extractDomain, isBlockedDomain, deduplicateUrls } from '../../utils/urlUtils.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';

const DDG_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
};

/**
 * Search DuckDuckGo HTML endpoint and parse results.
 * No API key required — uses the public HTML search page.
 */
export async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  logger.info({ query }, 'DDG: starting search');

  try {
    // Step 1: Get the VQID token from DDG HTML
    const formRes = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query, b: '', kl: 'en-us' },
      headers: DDG_HEADERS,
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(formRes.data as string);
    const results: SearchResult[] = [];
    const rawUrls: string[] = [];

    // Parse organic results
    $('.result__body').each((_, el) => {
      const titleEl = $(el).find('.result__a');
      const snippetEl = $(el).find('.result__snippet');
      const urlEl = $(el).find('.result__url');

      const title = titleEl.text().trim();
      const snippet = snippetEl.text().trim();

      // DDG encodes the actual URL in the href
      const href = titleEl.attr('href') ?? '';
      let url = '';

      if (href.startsWith('//duckduckgo.com/l/')) {
        // Extract the uddg parameter (actual URL)
        try {
          const encoded = new URL(`https:${href}`);
          url = decodeURIComponent(encoded.searchParams.get('uddg') ?? '');
        } catch {
          url = '';
        }
      } else if (href.startsWith('http')) {
        url = href;
      } else {
        // Fallback: try to read from result__url
        const urlText = urlEl.text().trim();
        if (urlText) url = urlText.startsWith('http') ? urlText : `https://${urlText}`;
      }

      if (!title || !url) return;

      const normalized = normalizeUrl(url);
      if (!normalized) return;
      if (isBlockedDomain(normalized)) return;

      rawUrls.push(normalized);
      results.push({
        title,
        url: normalized,
        snippet,
        domain: extractDomain(normalized),
      });
    });

    // Also parse any "news" results
    $('.result--news .result__body').each((_, el) => {
      const titleEl = $(el).find('.result__a');
      const snippetEl = $(el).find('.result__snippet');
      const href = titleEl.attr('href') ?? '';
      const title = titleEl.text().trim();
      const snippet = snippetEl.text().trim();

      let url = '';
      if (href.startsWith('http')) url = href;

      const normalized = normalizeUrl(url);
      if (!normalized || !title) return;
      if (isBlockedDomain(normalized)) return;
      if (rawUrls.includes(normalized)) return;

      rawUrls.push(normalized);
      results.push({
        title,
        url: normalized,
        snippet,
        domain: extractDomain(normalized),
      });
    });

    const deduped = deduplicateResults(results);
    const limited = deduped.slice(0, config.search.resultsLimit);

    logger.info({ query, count: limited.length }, 'DDG: search complete');
    return limited;
  } catch (err) {
    logger.error({ err, query }, 'DDG: search failed');
    return [];
  }
}

/**
 * Deduplicate search results by URL.
 */
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

/**
 * Extract just the URLs from search results.
 */
export function extractUrls(results: SearchResult[]): string[] {
  return deduplicateUrls(results.map((r) => r.url));
}

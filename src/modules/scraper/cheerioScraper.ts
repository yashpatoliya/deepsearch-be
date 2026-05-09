// ============================================================
// src/modules/scraper/cheerioScraper.ts — Fast HTML scraper
// ============================================================

import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedPage } from '../../types/index.js';
import { stripHtml } from '../../utils/textUtils.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';

const SCRAPER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  Connection: 'keep-alive',
};

// HTML elements to remove (noise/navigation/ads)
const NOISE_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer',
  '.nav', '.navbar', '.navigation', '.header', '.footer', '.sidebar',
  '.ads', '.ad', '.advertisement', '.cookie-banner', '.cookie-notice',
  '.newsletter', '.subscribe', '.social-share', '.comments', '.comment',
  '#nav', '#header', '#footer', '#sidebar', '#ads', '#comments',
  '[class*="ad-"]', '[class*="-ad"]', '[id*="ad-"]',
  '[class*="cookie"]', '[class*="modal"]', '[class*="popup"]',
  '[class*="banner"]', '[class*="overlay"]',
  'aside', 'form', 'button', 'input', 'select',
];

// Selectors for main content, in priority order
const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.article-body',
  '.story-body',
  '.content-body',
  '.page-content',
  '#content',
  '#main-content',
  '.main-content',
];

/**
 * Scrape a page using axios + cheerio (no browser required).
 * Suitable for most static HTML pages.
 */
export async function scrapeWithCheerio(url: string): Promise<ScrapedPage> {
  const startTime = Date.now();
  logger.debug({ url }, 'Cheerio: scraping page');

  try {
    const response = await axios.get<string>(url, {
      headers: SCRAPER_HEADERS,
      timeout: config.scraper.timeoutMs,
      maxRedirects: 5,
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      responseType: 'text',
      validateStatus: (status) => status < 400,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const publishedDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').first().attr('datetime') ||
      $('meta[name="date"]').attr('content') ||
      undefined;

    // Remove noise elements
    NOISE_SELECTORS.forEach((sel) => $(sel).remove());

    // Extract main content
    let content = '';
    for (const selector of CONTENT_SELECTORS) {
      const el = $(selector).first();
      if (el.length && el.text().trim().length > 200) {
        content = el.text().trim();
        break;
      }
    }

    // Fallback: use body text
    if (!content || content.length < 100) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // Trim to max length
    if (content.length > config.ai.maxContentLength) {
      content = content.slice(0, config.ai.maxContentLength);
    }

    logger.debug(
      { url, titleLen: title.length, contentLen: content.length, ms: Date.now() - startTime },
      'Cheerio: scrape complete'
    );

    return {
      url,
      title: stripHtml(title).slice(0, 300),
      description: stripHtml(description).slice(0, 500),
      content,
      publishedDate,
      scrapedAt: new Date().toISOString(),
      success: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.warn({ url, error, ms: Date.now() - startTime }, 'Cheerio: scrape failed');
    return {
      url,
      title: '',
      description: '',
      content: '',
      scrapedAt: new Date().toISOString(),
      success: false,
      error,
    };
  }
}

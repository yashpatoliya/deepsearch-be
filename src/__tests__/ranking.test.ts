// ============================================================
// src/__tests__/ranking.test.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { rankResults } from '../modules/ranking/index.js';
import type { SearchResult, ScrapedPage } from '../types/index.js';

const mockSearchResults: SearchResult[] = [
  {
    title: 'Elon Musk Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Elon_Musk',
    snippet: 'Elon Musk is a billionaire entrepreneur and CEO of Tesla and SpaceX.',
    domain: 'en.wikipedia.org',
  },
  {
    title: 'Elon Musk Latest News',
    url: 'https://randomnews.xyz/elon-musk',
    snippet: 'Some news about Elon Musk.',
    domain: 'randomnews.xyz',
  },
  {
    title: 'Tesla CEO Reuters',
    url: 'https://reuters.com/elon-musk-tesla',
    snippet: 'Elon Musk announced new Tesla features.',
    domain: 'reuters.com',
  },
];

const mockScrapedPages: ScrapedPage[] = [
  {
    url: 'https://en.wikipedia.org/wiki/Elon_Musk',
    title: 'Elon Musk - Wikipedia',
    description: 'Comprehensive article about Elon Musk',
    content:
      'Elon Reeve Musk is a business magnate, investor, and engineer. He is the founder, CEO and chief engineer of SpaceX. Also early-stage investor, CEO and product architect of Tesla. ' +
      'Musk was born on June 28, 1971, in Pretoria, South Africa. He studied economics and physics at the University of Pennsylvania.',
    publishedDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    scrapedAt: new Date().toISOString(),
    success: true,
  },
  {
    url: 'https://reuters.com/elon-musk-tesla',
    title: 'Elon Musk Tesla Reuters',
    description: 'Reuters article about Tesla',
    content: 'Elon Musk presented new Tesla Cybertruck features at an event.',
    publishedDate: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    success: true,
  },
];

describe('rankResults', () => {
  it('returns ranked results sorted by score descending', () => {
    const ranked = rankResults('elon musk', mockSearchResults, mockScrapedPages);
    expect(ranked.length).toBeGreaterThan(0);

    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i]!.score).toBeGreaterThanOrEqual(ranked[i + 1]!.score);
    }
  });

  it('gives Wikipedia a higher score than unknown domain', () => {
    const ranked = rankResults('elon musk', mockSearchResults, mockScrapedPages);
    const wikiResult = ranked.find((r) => r.url.includes('wikipedia.org'));
    const randomResult = ranked.find((r) => r.url.includes('randomnews.xyz'));

    expect(wikiResult).toBeDefined();
    expect(randomResult).toBeDefined();
    expect(wikiResult!.score).toBeGreaterThan(randomResult!.score);
  });

  it('each result has required fields', () => {
    const ranked = rankResults('elon musk', mockSearchResults, mockScrapedPages);
    ranked.forEach((r) => {
      expect(r).toHaveProperty('url');
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('domain');
      expect(typeof r.score).toBe('number');
    });
  });

  it('handles empty scrape results gracefully', () => {
    const ranked = rankResults('elon musk', mockSearchResults, []);
    expect(ranked.length).toBe(mockSearchResults.length);
  });
});

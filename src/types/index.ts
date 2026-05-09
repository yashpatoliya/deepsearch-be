// ============================================================
// src/types/index.ts — Shared type definitions
// ============================================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  content: string;
  publishedDate?: string;
  scrapedAt: string;
  success: boolean;
  error?: string;
}

export interface RankedResult {
  url: string;
  title: string;
  snippet: string;
  content: string;
  score: number;
  domain: string;
  publishedDate?: string;
}

export interface Profile {
  platform: string;
  url: string;
  username?: string;
}

export interface Article {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
}

export interface ResearchResponse {
  query: string;
  summary: string;
  key_points: string[];
  profiles: Profile[];
  articles: Article[];
  sources: string[];
  meta: {
    totalResults: number;
    processingTimeMs: number;
    cachedAt?: string;
    fromCache: boolean;
  };
}

export interface SearchJobData {
  query: string;
  urls: string[];
  jobId: string;
}

export interface ScrapeJobData {
  url: string;
  query: string;
  jobId: string;
}

export interface TfIdfResult {
  term: string;
  score: number;
}

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  cache: {
    ttlSeconds: number;
    pageTtlSeconds: number;
  };
  rateLimit: {
    max: number;
    windowMs: number;
  };
  queue: {
    concurrency: number;
    maxRetries: number;
    retryDelayMs: number;
  };
  scraper: {
    timeoutMs: number;
    maxUrls: number;
    useBrowser: boolean;
  };
  search: {
    resultsLimit: number;
  };
  ai: {
    summaryMaxSentences: number;
    keyPointsCount: number;
    maxContentLength: number;
  };
  log: {
    level: string;
  };
  security: {
    allowedHosts: string[];
  };
}

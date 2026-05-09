// ============================================================
// src/config/index.ts — Centralized configuration
// ============================================================

import 'dotenv/config';
import type { Config } from '../types/index.js';

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBool(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  return raw.toLowerCase() === 'true';
}

function getEnvList(key: string): string[] {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const config: Config = {
  port: getEnvInt('PORT', 3000),
  host: getEnv('HOST', '0.0.0.0'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvInt('REDIS_PORT', 6379),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: getEnvInt('REDIS_DB', 0),
  },
  cache: {
    ttlSeconds: getEnvInt('CACHE_TTL_SECONDS', 21600),
    pageTtlSeconds: getEnvInt('PAGE_CACHE_TTL_SECONDS', 86400),
  },
  rateLimit: {
    max: getEnvInt('RATE_LIMIT_MAX', 20),
    windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
  },
  queue: {
    concurrency: getEnvInt('QUEUE_CONCURRENCY', 5),
    maxRetries: getEnvInt('QUEUE_MAX_RETRIES', 3),
    retryDelayMs: getEnvInt('QUEUE_RETRY_DELAY_MS', 2000),
  },
  scraper: {
    timeoutMs: getEnvInt('SCRAPER_TIMEOUT_MS', 15000),
    maxUrls: getEnvInt('SCRAPER_MAX_URLS', 25),
    useBrowser: getEnvBool('SCRAPER_USE_BROWSER', false),
  },
  search: {
    resultsLimit: getEnvInt('SEARCH_RESULTS_LIMIT', 30),
  },
  ai: {
    summaryMaxSentences: getEnvInt('SUMMARY_MAX_SENTENCES', 5),
    keyPointsCount: getEnvInt('KEY_POINTS_COUNT', 5),
    maxContentLength: getEnvInt('MAX_CONTENT_LENGTH', 10000),
  },
  log: {
    level: getEnv('LOG_LEVEL', 'info'),
  },
  security: {
    allowedHosts: getEnvList('ALLOWED_HOSTS'),
  },
};

export default config;

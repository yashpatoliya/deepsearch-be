// ============================================================
// src/api/server.ts — Fastify server setup
// ============================================================

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { getRedisClient, closeRedis } from '../services/redisClient.js';
import searchRoute from './routes/search.js';
import cacheRoute from './routes/cache.js';
import statsRoute from './routes/stats.js';
import searchesRoute from './routes/searches.js';
import reportsRoute from './routes/reports.js';
import analyticsRoute from './routes/analytics.js';
import userRoute from './routes/user.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.log.level,
      ...(config.nodeEnv === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            },
          }
        : {}),
    },
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    genReqId: () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trustProxy: config.nodeEnv === 'production',
  });

  // ── CORS ──────────────────────────────────────────────────────
  await fastify.register(fastifyCors, {
    origin:
      config.nodeEnv === 'development'
        ? true
        : ['https://yourapp.com'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  // ── Rate Limiting ─────────────────────────────────────────────
  await fastify.register(fastifyRateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    redis: getRedisClient(),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${context.after}`,
      date: Date.now(),
      expiresIn: context.after,
    }),
  });

  // ── Global Error Handler ──────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(
      { err: error, reqId: request.id, url: request.url },
      'Unhandled error'
    );

    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    });
  });

  // ── 404 Handler ───────────────────────────────────────────────
  fastify.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // ── Health Endpoint ───────────────────────────────────────────
  fastify.get('/', async (_req, reply) => {
    return reply.send({
      name: 'Deep Research Engine',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        search: 'POST /search',
        health: 'GET /search/health',
        cacheStats: 'GET /cache/stats',
        clearCache: 'DELETE /cache/:query',
        homepageStats: 'GET /stats/homepage',
        latestSearches: 'GET /searches/latest',
        searchSuggestions: 'GET /search/suggestions',
        trendingSearches: 'GET /searches/trending',
        reportProgress: 'GET /reports/:id/progress',
        savedReports: 'GET /reports/saved',
        dashboardAnalytics: 'GET /analytics/dashboard',
        subscriptionStatus: 'GET /subscription/status',
        creditUsage: 'GET /credits/usage',
      },
    });
  });

  fastify.get('/health', async (_req, reply) => {
    let redisStatus = 'ok';
    try {
      await getRedisClient().ping();
    } catch {
      redisStatus = 'unavailable';
    }
    return reply.send({
      status: 'ok',
      redis: redisStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── Register Routes ───────────────────────────────────────────
  await fastify.register(searchRoute, { prefix: '/api/v1' });
  await fastify.register(cacheRoute, { prefix: '/api/v1' });
  await fastify.register(statsRoute, { prefix: '/api/v1' });
  await fastify.register(searchesRoute, { prefix: '/api/v1' });
  await fastify.register(reportsRoute, { prefix: '/api/v1' });
  await fastify.register(analyticsRoute, { prefix: '/api/v1' });
  await fastify.register(userRoute, { prefix: '/api/v1' });

  // ── Graceful Shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await fastify.close();
    await closeRedis();
    logger.info('Server shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return fastify;
}

// ============================================================
// src/api/routes/cache.ts — Cache management routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { getRedisClient, cacheDelete, buildQueryCacheKey } from '../../services/redisClient.js';
import logger from '../../utils/logger.js';

const cacheRoute: FastifyPluginAsync = async (fastify) => {
  // DELETE /cache/:query — Invalidate a specific query cache
  fastify.delete<{ Params: { query: string } }>(
    '/cache/:query',
    {
      schema: {
        params: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    },
    async (request, reply) => {
      const { query } = request.params;
      const cacheKey = buildQueryCacheKey(decodeURIComponent(query));
      await cacheDelete(cacheKey);
      logger.info({ query }, 'Cache: invalidated');
      return reply.send({ success: true, message: `Cache cleared for: ${query}` });
    }
  );

  // GET /cache/stats — Redis info
  fastify.get(
    '/cache/stats',
    {
      schema: {
      },
    },
    async (_req, reply) => {
      try {
        const redis = getRedisClient();
        const info = await redis.info('stats');
        const keyspace = await redis.info('keyspace');
        const memory = await redis.info('memory');

        const parseInfo = (raw: string): Record<string, string> => {
          return raw
            .split('\n')
            .filter((l) => l.includes(':') && !l.startsWith('#'))
            .reduce(
              (acc, line) => {
                const [k, v] = line.split(':');
                if (k && v) acc[k.trim()] = v.trim();
                return acc;
              },
              {} as Record<string, string>
            );
        };

        return reply.send({
          stats: parseInfo(info),
          keyspace: parseInfo(keyspace),
          memory: parseInfo(memory),
        });
      } catch (err) {
        logger.error({ err }, 'Cache: stats fetch failed');
        return reply.status(503).send({ error: 'Redis unavailable' });
      }
    }
  );
};

export default cacheRoute;

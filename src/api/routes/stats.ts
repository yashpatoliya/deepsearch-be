// ============================================================
// src/api/routes/stats.ts — Statistics and analytics routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import logger from '../../utils/logger.js';

const statsRoute: FastifyPluginAsync = async (fastify) => {
  // GET /stats/homepage — Homepage statistics
  fastify.get(
    '/stats/homepage',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              totalSearches: { type: 'integer' },
              activeUsers: { type: 'integer' },
              recentActivity: { type: 'integer' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        // TODO: Implement with database queries
        // For now, return mock data
        const stats = {
          totalSearches: 0, // Query from Search table
          activeUsers: 0,   // Query from User table
          recentActivity: 0, // Recent searches in last 24h
          timestamp: new Date().toISOString(),
        };

        logger.info('Stats: homepage stats requested');
        return reply.send(stats);
      } catch (err) {
        logger.error({ err }, 'Stats: homepage fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch homepage stats' });
      }
    }
  );
};

export default statsRoute;
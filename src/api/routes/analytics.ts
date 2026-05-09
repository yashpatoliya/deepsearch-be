// ============================================================
// src/api/routes/analytics.ts — Analytics routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import logger from '../../utils/logger.js';

const analyticsRoute: FastifyPluginAsync = async (fastify) => {
  // GET /analytics/dashboard — Dashboard analytics
  fastify.get(
    '/analytics/dashboard',
    {
      // TODO: Add authentication middleware
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              searches: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  thisMonth: { type: 'integer' },
                  lastMonth: { type: 'integer' },
                  trend: { type: 'number' }, // percentage change
                },
              },
              reports: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  completed: { type: 'integer' },
                  inProgress: { type: 'integer' },
                },
              },
              credits: {
                type: 'object',
                properties: {
                  used: { type: 'integer' },
                  remaining: { type: 'integer' },
                  monthlyLimit: { type: 'integer' },
                },
              },
              activity: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    searches: { type: 'integer' },
                    reports: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Get user from auth, query database
        const userId = 'mock-user'; // From auth middleware

        // Mock data
        const analytics = {
          searches: {
            total: 45,
            thisMonth: 23,
            lastMonth: 22,
            trend: 4.5,
          },
          reports: {
            total: 12,
            completed: 10,
            inProgress: 2,
          },
          credits: {
            used: 150,
            remaining: 850,
            monthlyLimit: 1000,
          },
          activity: [
            { date: '2024-01-01', searches: 5, reports: 1 },
            { date: '2024-01-02', searches: 3, reports: 0 },
          ],
        };

        logger.info({ userId }, 'Analytics: dashboard requested');
        return reply.send(analytics);
      } catch (err) {
        logger.error({ err }, 'Analytics: dashboard fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch dashboard analytics' });
      }
    }
  );
};

export default analyticsRoute;
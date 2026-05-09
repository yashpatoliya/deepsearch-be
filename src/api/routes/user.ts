// ============================================================
// src/api/routes/user.ts — User-related routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import logger from '../../utils/logger.js';

const userRoute: FastifyPluginAsync = async (fastify) => {
  // GET /subscription/status — Subscription status
  fastify.get(
    '/subscription/status',
    {
      // TODO: Add authentication middleware
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              plan: { type: 'string', enum: ['free', 'basic', 'premium', 'enterprise'] },
              status: { type: 'string', enum: ['active', 'inactive', 'cancelled', 'expired'] },
              currentPeriodStart: { type: 'string' },
              currentPeriodEnd: { type: 'string' },
              cancelAtPeriodEnd: { type: 'boolean' },
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
        const subscription = {
          plan: 'basic',
          status: 'active',
          currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        };

        logger.info({ userId }, 'User: subscription status requested');
        return reply.send(subscription);
      } catch (err) {
        logger.error({ err }, 'User: subscription status fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch subscription status' });
      }
    }
  );

  // GET /credits/usage — Credit usage
  fastify.get(
    '/credits/usage',
    {
      // TODO: Add authentication middleware
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              current: { type: 'integer' },
              used: { type: 'integer' },
              limit: { type: 'integer' },
              resetDate: { type: 'string' },
              history: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    amount: { type: 'integer' },
                    action: { type: 'string' },
                    description: { type: 'string' },
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
        const creditUsage = {
          current: 850,
          used: 150,
          limit: 1000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          history: [
            {
              date: new Date().toISOString(),
              amount: -10,
              action: 'search',
              description: 'Deep search query',
            },
            {
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              amount: -25,
              action: 'report',
              description: 'Report generation',
            },
          ],
        };

        logger.info({ userId }, 'User: credit usage requested');
        return reply.send(creditUsage);
      } catch (err) {
        logger.error({ err }, 'User: credit usage fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch credit usage' });
      }
    }
  );
};

export default userRoute;
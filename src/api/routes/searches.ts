// ============================================================
// src/api/routes/searches.ts — Search-related routes
// ============================================================

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import logger from '../../utils/logger.js';

// ── Schemas ───────────────────────────────────────────────────
const SuggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100).trim(),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

type SuggestionsQuery = z.infer<typeof SuggestionsQuerySchema>;

const searchesRoute: FastifyPluginAsync = async (fastify) => {
  // GET /searches/latest — Latest searches (authenticated)
  fastify.get(
    '/searches/latest',
    {
      // TODO: Add authentication middleware
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                query: { type: 'string' },
                timestamp: { type: 'string' },
                status: { type: 'string' },
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

        // Mock data for now
        const latestSearches = [
          {
            id: '1',
            query: 'Recent search example',
            timestamp: new Date().toISOString(),
            status: 'completed',
          },
        ];

        logger.info({ userId }, 'Searches: latest requested');
        return reply.send(latestSearches);
      } catch (err) {
        logger.error({ err }, 'Searches: latest fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch latest searches' });
      }
    }
  );

  // GET /search/suggestions — Search suggestions
  fastify.get<{ Querystring: SuggestionsQuery }>(
    '/search/suggestions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 100 },
            limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          },
          required: ['q'],
        },
        response: {
          200: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const parseResult = SuggestionsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid query parameters',
          details: parseResult.error.errors.map((e) => e.message).join(', '),
        });
      }

      const { q, limit } = parseResult.data;

      try {
        // TODO: Query database for suggestions based on prefix
        // For now, return mock suggestions
        const suggestions = [
          `${q} results`,
          `${q} analysis`,
          `${q} trends`,
        ].slice(0, limit);

        logger.info({ query: q, limit }, 'Search: suggestions requested');
        return reply.send(suggestions);
      } catch (err) {
        logger.error({ err, query: q }, 'Search: suggestions failed');
        return reply.status(500).send({ error: 'Failed to fetch suggestions' });
      }
    }
  );

  // GET /searches/trending — Trending searches
  fastify.get(
    '/searches/trending',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                count: { type: 'integer' },
                trend: { type: 'string' }, // 'up', 'down', 'stable'
              },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      try {
        // TODO: Query database for trending searches
        // Mock data
        const trending = [
          { query: 'AI trends', count: 150, trend: 'up' },
          { query: 'Market analysis', count: 120, trend: 'stable' },
        ];

        logger.info('Searches: trending requested');
        return reply.send(trending);
      } catch (err) {
        logger.error({ err }, 'Searches: trending fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch trending searches' });
      }
    }
  );
};

export default searchesRoute;
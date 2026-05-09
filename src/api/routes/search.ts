// ============================================================
// src/api/routes/search.ts — POST /search route
// ============================================================

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { runResearch } from '../../services/researchEngine.js';
import logger from '../../utils/logger.js';

// ── Request Schema ───────────────────────────────────────────
const SearchBodySchema = z.object({
  query: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(200, 'Query must not exceed 200 characters')
    .trim(),
  deep_mode: z.boolean().optional().default(false),
  max_results: z.number().int().min(1).max(20).optional().default(10),
  context_query: z.string().max(200).optional(),
  no_cache: z.boolean().optional().default(false),
});

type SearchBody = z.infer<typeof SearchBodySchema>;

// ── Fastify JSON Schema for validation ───────────────────────
const searchBodyJsonSchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 2, maxLength: 200 },
    deep_mode: { type: 'boolean', default: false },
    max_results: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
    context_query: { type: 'string', maxLength: 200 },
    no_cache: { type: 'boolean', default: false },
  },
};

const searchRoute: FastifyPluginAsync = async (fastify) => {
  // POST /search — Main research endpoint
  fastify.post<{ Body: SearchBody }>(
    '/search',
    {
      schema: {
        body: searchBodyJsonSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              summary: { type: 'string' },
              key_points: { type: 'array', items: { type: 'string' } },
              profiles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    platform: { type: 'string' },
                    url: { type: 'string' },
                    username: { type: 'string' },
                  },
                },
              },
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    url: { type: 'string' },
                    snippet: { type: 'string' },
                    score: { type: 'number' },
                    publishedDate: { type: 'string' },
                  },
                },
              },
              sources: { type: 'array', items: { type: 'string' } },
              meta: {
                type: 'object',
                properties: {
                  totalResults: { type: 'integer' },
                  processingTimeMs: { type: 'integer' },
                  fromCache: { type: 'boolean' },
                  cachedAt: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SearchBody }>, reply: FastifyReply) => {
      // Validate with Zod (double layer)
      const parseResult = SearchBodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.errors.map((e) => e.message).join(', '),
        });
      }

      const { query, deep_mode, max_results, context_query, no_cache } = parseResult.data;

      logger.info(
        { query, deepMode: deep_mode, maxResults: max_results, ip: request.ip },
        'API: search request received'
      );

      try {
        const result = await runResearch(query, {
          deepMode: deep_mode,
          maxResults: max_results,
          useCache: !no_cache,
          contextQuery: context_query,
        });

        return reply
          .status(200)
          .header('X-Request-Id', request.id)
          .header('X-Processing-Time-Ms', String(result.meta.processingTimeMs))
          .header('X-From-Cache', String(result.meta.fromCache))
          .send(result);
      } catch (err) {
        logger.error({ err, query }, 'API: research failed');
        return reply.status(500).send({
          error: 'Research failed',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  );

  // GET /search/health — Quick health check
  fastify.get('/search/health', async (_req, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });
};

export default searchRoute;

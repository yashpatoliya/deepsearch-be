// ============================================================
// src/api/routes/reports.ts — Report management routes
// ============================================================

import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import logger from '../../utils/logger.js';

const reportsRoute: FastifyPluginAsync = async (fastify) => {
  // GET /reports/:id/progress — Report generation progress
  fastify.get<{ Params: { id: string } }>(
    '/reports/:id/progress',
    {
      // TODO: Add authentication middleware
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
              progress: { type: 'number', minimum: 0, maximum: 100 },
              message: { type: 'string' },
              estimatedTimeRemaining: { type: 'integer' }, // seconds
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        // TODO: Query database for report progress
        // Mock data
        const progress = {
          id,
          status: 'processing',
          progress: 65,
          message: 'Analyzing sources...',
          estimatedTimeRemaining: 45,
        };

        logger.info({ reportId: id }, 'Reports: progress requested');
        return reply.send(progress);
      } catch (err) {
        logger.error({ err, reportId: id }, 'Reports: progress fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch report progress' });
      }
    }
  );

  // GET /reports/saved — User's saved reports
  fastify.get(
    '/reports/saved',
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
                title: { type: 'string' },
                query: { type: 'string' },
                createdAt: { type: 'string' },
                status: { type: 'string' },
                fileUrl: { type: 'string' },
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
        const savedReports = [
          {
            id: '1',
            title: 'AI Market Analysis Report',
            query: 'AI market trends',
            createdAt: new Date().toISOString(),
            status: 'completed',
            fileUrl: '/downloads/report-1.pdf',
          },
        ];

        logger.info({ userId }, 'Reports: saved requested');
        return reply.send(savedReports);
      } catch (err) {
        logger.error({ err }, 'Reports: saved fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch saved reports' });
      }
    }
  );
};

export default reportsRoute;
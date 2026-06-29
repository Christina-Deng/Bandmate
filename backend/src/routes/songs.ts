import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getRecommendationsForBand } from '../services/recommendationService.js';

export async function registerSongRoutes(app: FastifyInstance) {
  app.get('/songs/recommend', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { bandId?: string; useAi?: string };
    if (!query.bandId) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请提供 bandId' },
      });
    }

    const useAi = query.useAi === 'true' || query.useAi === '1';

    try {
      return await getRecommendationsForBand(query.bandId, request.userId!, { useAi });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      if (e.statusCode === 403) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: e.message ?? '无权访问该乐队' },
        });
      }
      throw err;
    }
  });
}

import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import type { RecommendationResponse } from '../types/song.js';

export async function registerSongRoutes(app: FastifyInstance) {
  app.get('/songs/recommend', { preHandler: authenticate }, async (): Promise<RecommendationResponse> => {
    return {
      status: 'coming_soon',
      songs: [],
      message: '功能开发中，敬请期待',
    };
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import path from 'node:path';
import { registerAuthRoutes } from './routes/auth.js';
import { registerBandRoutes } from './routes/bands.js';
import { registerPracticeRoutes } from './routes/practices.js';
import { registerSongRoutes } from './routes/songs.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  app.get('/health', async () => ({ ok: true }));

  await registerAuthRoutes(app);
  await registerBandRoutes(app);
  await registerPracticeRoutes(app);
  await registerSongRoutes(app);

  app.register(import('@fastify/static'), {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  return app;
}

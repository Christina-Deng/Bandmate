import type { FastifyInstance } from 'fastify';
import * as authService from '../services/authService.js';
import { authenticate } from '../middleware/authenticate.js';

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = request.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!body.email || !body.password || !body.displayName) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写邮箱、密码和昵称' },
      });
    }

    try {
      const user = await authService.register({
        email: body.email,
        password: body.password,
        displayName: body.displayName,
      });
      return reply.status(201).send({ user });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'REGISTER_FAILED', message: err.message },
      });
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写邮箱和密码' },
      });
    }

    try {
      const { user, token } = await authService.login({
        email: body.email,
        password: body.password,
      });
      reply.setCookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return { user };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'LOGIN_FAILED', message: err.message },
      });
    }
  });

  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await authService.getMe(request.userId!);
    if (!user) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: '用户不存在' },
      });
    }
    return { user };
  });
}

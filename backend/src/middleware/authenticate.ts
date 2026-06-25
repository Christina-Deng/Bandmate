import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken } from '../services/authService.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies.token;
  if (!token) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: '未登录' } });
  }

  try {
    const payload = verifyToken(token);
    request.userId = payload.userId;
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: '登录已失效' } });
  }
}

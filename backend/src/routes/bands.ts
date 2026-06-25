import { Instrument } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import * as bandService from '../services/bandService.js';
import type { QuestionnaireAnswers } from '../services/skillAssessment.js';

export async function registerBandRoutes(app: FastifyInstance) {
  app.post('/bands', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { name?: string; stylePreferences?: string[] };
    if (!body.name) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写乐队名称' },
      });
    }

    try {
      const band = await bandService.createBand({
        userId: request.userId!,
        name: body.name,
        stylePreferences: body.stylePreferences,
      });
      return reply.status(201).send({ band });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'CREATE_BAND_FAILED', message: err.message },
      });
    }
  });

  app.post('/bands/join', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { inviteCode?: string };
    if (!body.inviteCode) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写邀请码' },
      });
    }

    try {
      const band = await bandService.joinBand({
        userId: request.userId!,
        inviteCode: body.inviteCode,
      });
      return { band };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'JOIN_BAND_FAILED', message: err.message },
      });
    }
  });

  app.get('/bands/me', { preHandler: authenticate }, async (request) => {
    const band = await bandService.getMyBand(request.userId!);
    return { band };
  });

  app.get('/bands/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const band = await bandService.getBand(id, request.userId!);
      return { band };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'GET_BAND_FAILED', message: err.message },
      });
    }
  });

  app.put('/bands/:id/members/me', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      instrument?: Instrument;
      questionnaireAnswers?: QuestionnaireAnswers;
    };

    if (!body.instrument || !body.questionnaireAnswers) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写乐器和问卷' },
      });
    }

    try {
      const member = await bandService.updateMyMemberProfile({
        bandId: id,
        userId: request.userId!,
        instrument: body.instrument,
        questionnaireAnswers: body.questionnaireAnswers,
      });
      return { member };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'UPDATE_PROFILE_FAILED', message: err.message },
      });
    }
  });

  app.delete('/bands/:id/members/me', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const result = await bandService.leaveBand({
        bandId: id,
        userId: request.userId!,
      });
      return { ...result, message: result.disbanded ? '你已退出乐队，乐队已解散' : '你已退出乐队' };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'LEAVE_BAND_FAILED', message: err.message },
      });
    }
  });
}

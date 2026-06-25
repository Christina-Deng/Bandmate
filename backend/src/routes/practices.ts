import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import * as practiceService from '../services/practiceService.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function registerPracticeRoutes(app: FastifyInstance) {
  await ensureUploadDir();

  app.post('/practices', { preHandler: authenticate }, async (request, reply) => {
    const parts = request.parts();
    let bandId = '';
    let durationMinutes = 0;
    let note: string | undefined;
    let audioUrl: string | undefined;

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'bandId') bandId = String(part.value);
        if (part.fieldname === 'durationMinutes') {
          durationMinutes = Number(part.value);
        }
        if (part.fieldname === 'note') note = String(part.value);
      }

      if (part.type === 'file' && part.fieldname === 'audio') {
        const ext = path.extname(part.filename).toLowerCase();
        if (!['.mp3', '.wav'].includes(ext)) {
          return reply.status(400).send({
            error: { code: 'VALIDATION_ERROR', message: '仅支持 mp3/wav 格式' },
          });
        }
        const filename = `${randomUUID()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        const buffer = await part.toBuffer();
        await fs.writeFile(filepath, buffer);
        audioUrl = `/uploads/${filename}`;
      }
    }

    if (!bandId || !durationMinutes) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请填写乐队和练习时长' },
      });
    }

    try {
      const practice = await practiceService.createPractice({
        bandId,
        userId: request.userId!,
        durationMinutes,
        note,
        audioUrl,
      });
      return reply.status(201).send({ practice });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'CREATE_PRACTICE_FAILED', message: err.message },
      });
    }
  });

  app.get('/practices', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { bandId?: string; month?: string };
    if (!query.bandId || !query.month) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请提供 bandId 和 month' },
      });
    }

    try {
      const practices = await practiceService.getMonthPractices(
        query.bandId,
        request.userId!,
        query.month,
      );
      return { practices };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'GET_PRACTICES_FAILED', message: err.message },
      });
    }
  });

  app.get('/practices/today', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { bandId?: string };
    if (!query.bandId) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: '请提供 bandId' },
      });
    }

    try {
      const members = await practiceService.getTodayStatus(query.bandId, request.userId!);
      return { members };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      return reply.status(err.statusCode ?? 500).send({
        error: { code: 'GET_TODAY_FAILED', message: err.message },
      });
    }
  });
}

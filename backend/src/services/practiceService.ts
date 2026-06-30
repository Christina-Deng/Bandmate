import { prisma } from '../lib/prisma.js';
import { parsePracticeDate, practiceDateString } from '../lib/practiceDates.js';

export async function createPractice(input: {
  bandId: string;
  userId: string;
  durationMinutes: number;
  note?: string;
  audioUrl?: string;
}) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  if (input.durationMinutes < 1) {
    throw Object.assign(new Error('Duration must be at least 1 minute'), { statusCode: 400 });
  }

  const date = parsePracticeDate(practiceDateString());

  try {
    return await prisma.practiceLog.create({
      data: {
        bandId: input.bandId,
        userId: input.userId,
        date,
        durationMinutes: input.durationMinutes,
        note: input.note,
        audioUrl: input.audioUrl,
      },
      include: {
        user: { select: { id: true, displayName: true } },
      },
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw Object.assign(new Error('Already checked in today'), { statusCode: 409 });
    }
    throw error;
  }
}

export async function getMonthPractices(bandId: string, userId: string, month: string) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId, userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNum - 1, 1));
  const end = new Date(Date.UTC(year, monthNum, 1));

  return prisma.practiceLog.findMany({
    where: {
      bandId,
      date: { gte: start, lt: end },
    },
    include: {
      user: { select: { id: true, displayName: true } },
    },
    orderBy: { date: 'asc' },
  });
}

export async function getTodayStatus(bandId: string, userId: string) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId, userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  const today = parsePracticeDate(practiceDateString());

  const members = await prisma.bandMember.findMany({
    where: { bandId },
    include: {
      user: { select: { id: true, displayName: true } },
    },
  });

  const todayLogs = await prisma.practiceLog.findMany({
    where: { bandId, date: today },
  });

  const logByUser = new Map(todayLogs.map((log) => [log.userId, log]));

  return members.map((member) => {
    const log = logByUser.get(member.userId);
    return {
      userId: member.user.id,
      displayName: member.user.displayName,
      instrument: member.instrument,
      skillLevel: member.skillLevel,
      profileComplete: member.questionnaireAnswers !== null,
      checkedIn: Boolean(log),
      durationMinutes: log?.durationMinutes ?? null,
      note: log?.note ?? null,
      audioUrl: log?.audioUrl ?? null,
    };
  });
}

export { practiceDateString as todayDateString };

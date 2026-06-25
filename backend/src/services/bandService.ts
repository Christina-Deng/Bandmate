import crypto from 'node:crypto';
import { Instrument, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  calculateSkillLevel,
  type QuestionnaireAnswers,
} from './skillAssessment.js';

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex');
}

async function getUserMembership(userId: string) {
  return prisma.bandMember.findFirst({
    where: { userId },
    include: { band: true },
  });
}

export async function createBand(input: {
  userId: string;
  name: string;
  stylePreferences?: string[];
}) {
  const existing = await getUserMembership(input.userId);
  if (existing) {
    throw Object.assign(new Error('User already belongs to a band'), { statusCode: 409 });
  }

  let inviteCode = generateInviteCode();
  while (await prisma.band.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const band = await prisma.band.create({
    data: {
      name: input.name,
      stylePreferences:
        input.stylePreferences && input.stylePreferences.length > 0
          ? input.stylePreferences
          : undefined,
      inviteCode,
      createdById: input.userId,
      members: {
        create: {
          userId: input.userId,
          instrument: Instrument.OTHER,
          skillLevel: 1,
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true } } },
      },
    },
  });

  return band;
}

export async function joinBand(input: { userId: string; inviteCode: string }) {
  const existing = await getUserMembership(input.userId);
  if (existing) {
    throw Object.assign(new Error('User already belongs to a band'), { statusCode: 409 });
  }

  const band = await prisma.band.findUnique({ where: { inviteCode: input.inviteCode } });
  if (!band) {
    throw Object.assign(new Error('Invalid invite code'), { statusCode: 404 });
  }

  await prisma.bandMember.create({
    data: {
      bandId: band.id,
      userId: input.userId,
      instrument: Instrument.OTHER,
      skillLevel: 1,
    },
  });

  return getBand(band.id, input.userId);
}

export async function getBand(bandId: string, userId: string) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId, userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  return prisma.band.findUniqueOrThrow({
    where: { id: bandId },
    include: {
      members: {
        include: {
          user: { select: { id: true, displayName: true } },
        },
      },
    },
  });
}

export async function getMyBand(userId: string) {
  const membership = await getUserMembership(userId);
  if (!membership) return null;
  return getBand(membership.bandId, userId);
}

export async function updateMyMemberProfile(input: {
  bandId: string;
  userId: string;
  instrument: Instrument;
  questionnaireAnswers: QuestionnaireAnswers;
}) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('Not a band member'), { statusCode: 403 });
  }

  const skillLevel = calculateSkillLevel(input.questionnaireAnswers);

  return prisma.bandMember.update({
    where: { id: membership.id },
    data: {
      instrument: input.instrument,
      questionnaireAnswers: input.questionnaireAnswers as unknown as Prisma.InputJsonValue,
      skillLevel,
    },
    include: {
      user: { select: { id: true, displayName: true } },
    },
  });
}

export async function leaveBand(input: { bandId: string; userId: string }) {
  const membership = await prisma.bandMember.findUnique({
    where: { bandId_userId: { bandId: input.bandId, userId: input.userId } },
  });
  if (!membership) {
    throw Object.assign(new Error('你不是该乐队成员'), { statusCode: 403 });
  }

  const memberCount = await prisma.bandMember.count({
    where: { bandId: input.bandId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.practiceLog.deleteMany({
      where: { bandId: input.bandId, userId: input.userId },
    });
    await tx.bandMember.delete({ where: { id: membership.id } });

    if (memberCount === 1) {
      await tx.band.delete({ where: { id: input.bandId } });
    }
  });

  return { disbanded: memberCount === 1 };
}

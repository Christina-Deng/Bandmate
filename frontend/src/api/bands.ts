import { api } from './client';
import type { Band, Instrument, QuestionnaireAnswers } from '../types/band';

export async function createBand(input: { name: string; stylePreferences?: string[] }) {
  const { data } = await api.post<{ band: Band }>('/bands', input);
  return data.band;
}

export async function joinBand(inviteCode: string) {
  const { data } = await api.post<{ band: Band }>('/bands/join', { inviteCode });
  return data.band;
}

export async function getMyBand() {
  const { data } = await api.get<{ band: Band | null }>('/bands/me');
  return data.band;
}

export async function updateMyProfile(
  bandId: string,
  input: { instrument: Instrument; questionnaireAnswers: QuestionnaireAnswers },
) {
  const { data } = await api.put<{ member: Band['members'][0] }>(
    `/bands/${bandId}/members/me`,
    input,
  );
  return data.member;
}

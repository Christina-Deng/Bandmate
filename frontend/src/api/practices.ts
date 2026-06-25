import { api } from './client';
import type { PracticeLog, TodayMemberStatus } from '../types/practice';

export async function submitPractice(formData: FormData) {
  const { data } = await api.post<{ practice: PracticeLog }>('/practices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.practice;
}

export async function getMonthPractices(bandId: string, month: string) {
  const { data } = await api.get<{ practices: PracticeLog[] }>('/practices', {
    params: { bandId, month },
  });
  return data.practices;
}

export async function getTodayStatus(bandId: string) {
  const { data } = await api.get<{ members: TodayMemberStatus[] }>('/practices/today', {
    params: { bandId },
  });
  return data.members;
}

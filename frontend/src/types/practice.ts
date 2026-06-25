export interface PracticeLog {
  id: string;
  bandId: string;
  userId: string;
  date: string;
  durationMinutes: number;
  note: string | null;
  audioUrl: string | null;
  user: { id: string; displayName: string };
}

export interface TodayMemberStatus {
  userId: string;
  displayName: string;
  instrument: string;
  skillLevel: number;
  profileComplete: boolean;
  checkedIn: boolean;
  durationMinutes: number | null;
  note: string | null;
  audioUrl: string | null;
}

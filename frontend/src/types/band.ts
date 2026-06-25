export type Instrument = 'GUITAR' | 'BASS' | 'DRUMS' | 'VOCALS' | 'OTHER';

export type WeeklyPracticeHours = '<1' | '1-3' | '3-5' | '5+';

export interface QuestionnaireAnswers {
  weeklyPracticeHours: WeeklyPracticeHours;
  stylePreference: string;
  instrumentSkills: boolean[];
}

export interface BandMember {
  id: string;
  instrument: Instrument;
  skillLevel: number;
  questionnaireAnswers: QuestionnaireAnswers | null;
  user: { id: string; displayName: string };
}

export interface Band {
  id: string;
  name: string;
  inviteCode: string;
  stylePreference: string | null;
  members: BandMember[];
}

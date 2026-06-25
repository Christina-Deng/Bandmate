export type PlayingExperience = '<1' | '1-3' | '3-5' | '5+';

/** @deprecated Legacy field; use playingExperience. */
export type WeeklyPracticeHours = PlayingExperience;

export interface QuestionnaireAnswers {
  playingExperience: PlayingExperience;
  stylePreferences: string[];
  instrumentSkills: boolean[];
  /** @deprecated Legacy field from earlier questionnaire versions. */
  weeklyPracticeHours?: WeeklyPracticeHours;
  /** @deprecated Legacy single-select style. */
  stylePreference?: string;
}

export type Instrument =
  | 'GUITAR'
  | 'BASS'
  | 'DRUMS'
  | 'VOCALS'
  | 'KEYBOARD'
  | 'OTHER';

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
  stylePreferences: string[] | null;
  members: BandMember[];
}

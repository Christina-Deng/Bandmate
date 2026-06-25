export type PlayingExperience = '<1' | '1-3' | '3-5' | '5+';

export interface QuestionnaireAnswers {
  playingExperience?: PlayingExperience;
  stylePreferences?: string[];
  instrumentSkills: boolean[];
  /** @deprecated Legacy field; mapped to playingExperience when scoring. */
  weeklyPracticeHours?: PlayingExperience;
  /** @deprecated Legacy single-select style. */
  stylePreference?: string;
}

function experienceScore(experience: PlayingExperience): number {
  const map: Record<PlayingExperience, number> = {
    '<1': 0,
    '1-3': 1,
    '3-5': 2,
    '5+': 3,
  };
  return map[experience];
}

function resolvePlayingExperience(answers: QuestionnaireAnswers): PlayingExperience {
  if (answers.playingExperience) return answers.playingExperience;
  if (answers.weeklyPracticeHours) return answers.weeklyPracticeHours;
  return '<1';
}

export function calculateSkillLevel(answers: QuestionnaireAnswers): number {
  const experience = experienceScore(resolvePlayingExperience(answers));
  const skills = answers.instrumentSkills.filter(Boolean).length;
  const total = experience + skills;

  if (total <= 1) return 1;
  if (total <= 3) return 2;
  if (total === 4) return 3;
  if (total <= 6) return 4;
  return 5;
}

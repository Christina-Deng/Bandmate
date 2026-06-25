export type WeeklyPracticeHours = '<1' | '1-3' | '3-5' | '5+';

export interface QuestionnaireAnswers {
  weeklyPracticeHours: WeeklyPracticeHours;
  stylePreference?: string;
  instrumentSkills: boolean[];
}

function practiceScore(hours: WeeklyPracticeHours): number {
  const map: Record<WeeklyPracticeHours, number> = {
    '<1': 0,
    '1-3': 1,
    '3-5': 2,
    '5+': 3,
  };
  return map[hours];
}

export function calculateSkillLevel(answers: QuestionnaireAnswers): number {
  const practice = practiceScore(answers.weeklyPracticeHours);
  const skills = answers.instrumentSkills.filter(Boolean).length;
  const total = practice + skills;

  if (total <= 1) return 1;
  if (total <= 3) return 2;
  if (total === 4) return 3;
  if (total <= 6) return 4;
  return 5;
}

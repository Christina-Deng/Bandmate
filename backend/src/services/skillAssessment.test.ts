import { describe, it, expect } from 'vitest';
import { calculateSkillLevel } from './skillAssessment.js';

describe('calculateSkillLevel', () => {
  it('returns level 1 for minimal answers', () => {
    const level = calculateSkillLevel({
      playingExperience: '<1',
      stylePreferences: [],
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(1);
  });

  it('returns level 5 for max experience + all skills', () => {
    const level = calculateSkillLevel({
      playingExperience: '5+',
      stylePreferences: ['rock'],
      instrumentSkills: [true, true, true, true],
    });
    expect(level).toBe(5);
  });

  it('weights playing experience independently', () => {
    const level = calculateSkillLevel({
      playingExperience: '5+',
      stylePreferences: [],
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(2);
  });

  it('supports legacy weeklyPracticeHours field', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '5+',
      stylePreferences: [],
      instrumentSkills: [true, true, true, true],
    });
    expect(level).toBe(5);
  });
});

import { describe, it, expect } from 'vitest';
import { calculateSkillLevel } from './skillAssessment.js';

describe('calculateSkillLevel', () => {
  it('returns level 1 for minimal answers', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '<1',
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(1);
  });

  it('returns level 5 for max practice + all skills', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '5+',
      instrumentSkills: [true, true, true, true],
    });
    expect(level).toBe(5);
  });

  it('weights practice duration independently', () => {
    const level = calculateSkillLevel({
      weeklyPracticeHours: '5+',
      instrumentSkills: [false, false, false, false],
    });
    expect(level).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { bandToRuleEngineInput } from './bandProfileForRecommend.js';

describe('bandToRuleEngineInput', () => {
  it('uses band style preferences when set', () => {
    const input = bandToRuleEngineInput({
      name: 'Test Band',
      stylePreferences: ['rock', 'pop'],
      members: [
        {
          instrument: 'GUITAR',
          skillLevel: 3,
          questionnaireAnswers: { stylePreferences: ['jazz'] },
          user: { id: 'u1', displayName: 'A' },
        },
      ],
    } as never);

    expect(input.stylePreferences).toEqual(['rock', 'pop']);
    expect(input.stylePreferenceSource).toBe('band');
  });

  it('falls back to member questionnaire styles when band styles are empty', () => {
    const input = bandToRuleEngineInput({
      name: 'Test Band',
      stylePreferences: null,
      members: [
        {
          instrument: 'GUITAR',
          skillLevel: 3,
          questionnaireAnswers: { stylePreferences: ['jazz', 'blues'] },
          user: { id: 'u1', displayName: 'A' },
        },
        {
          instrument: 'DRUMS',
          skillLevel: 3,
          questionnaireAnswers: { stylePreferences: ['blues', 'rock'] },
          user: { id: 'u2', displayName: 'B' },
        },
      ],
    } as never);

    expect(input.stylePreferences.sort()).toEqual(['blues', 'jazz', 'rock']);
    expect(input.stylePreferenceSource).toBe('members');
  });
});

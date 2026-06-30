import { describe, expect, it } from 'vitest';
import {
  addPracticeDays,
  computeStreak,
  parsePracticeDate,
  practiceDateString,
  startOfPracticeWeek,
} from './practiceDates.js';

describe('practiceDates', () => {
  it('uses UTC calendar date for practiceDateString', () => {
    const date = new Date('2026-06-27T15:30:00.000Z');
    expect(practiceDateString(date)).toBe('2026-06-27');
  });

  it('round-trips parsePracticeDate and practiceDateString', () => {
    const dateStr = '2026-06-25';
    expect(practiceDateString(parsePracticeDate(dateStr))).toBe(dateStr);
  });

  it('addPracticeDays moves across month boundaries in UTC', () => {
    expect(addPracticeDays('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('startOfPracticeWeek returns Monday in UTC', () => {
    expect(startOfPracticeWeek('2026-06-25')).toBe('2026-06-22');
  });
});

describe('computeStreak', () => {
  const today = '2026-06-25';

  it('returns 0 when no practice days', () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it('counts consecutive days including today', () => {
    expect(computeStreak(['2026-06-25', '2026-06-24', '2026-06-23'], today)).toBe(3);
  });

  it('uses yesterday as anchor when today is missing', () => {
    expect(computeStreak(['2026-06-24', '2026-06-23'], today)).toBe(2);
  });

  it('returns 0 when gap before today/yesterday', () => {
    expect(computeStreak(['2026-06-22'], today)).toBe(0);
  });
});

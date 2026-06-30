import { describe, it, expect } from 'vitest';
import { computeStreak } from '../lib/practiceDates.js';

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

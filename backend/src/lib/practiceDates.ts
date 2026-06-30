/** Practice logs use UTC calendar dates (YYYY-MM-DD at 00:00:00.000Z). */

export function practiceDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function parsePracticeDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function addPracticeDays(dateStr: string, delta: number): string {
  const date = parsePracticeDate(dateStr);
  date.setUTCDate(date.getUTCDate() + delta);
  return practiceDateString(date);
}

export function startOfPracticeWeek(dateStr: string): string {
  const weekday = parsePracticeDate(dateStr).getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addPracticeDays(dateStr, diff);
}

export function startOfPracticeMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/** Consecutive practice days ending today, or yesterday if not yet checked in today. */
export function computeStreak(uniqueDatesDesc: string[], todayStr: string): number {
  if (uniqueDatesDesc.length === 0) return 0;

  const dateSet = new Set(uniqueDatesDesc);
  let anchor = todayStr;
  if (!dateSet.has(anchor)) {
    anchor = addPracticeDays(todayStr, -1);
    if (!dateSet.has(anchor)) return 0;
  }

  let streak = 0;
  let cursor = anchor;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addPracticeDays(cursor, -1);
  }
  return streak;
}

import { dateFromKey } from '../utils/dates.ts';

export function reminderRoutineFromUrl(url: string | null): string | null {
  const match = url?.match(/^pill-tracker-(?:test|dev):\/\/routine\/(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;
  try {
    dateFromKey(match[1]);
    return match[1];
  } catch {
    return null;
  }
}

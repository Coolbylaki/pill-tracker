import { dateFromKey } from '../utils/dates.ts';

// Accept older dated notification links during in-place APK updates, but always open Home.
export function reminderOpensHome(url: string | null): boolean {
  if (url?.match(/^pill-tracker-(?:test|dev):\/\/home$/)) return true;
  const match = url?.match(/^pill-tracker-(?:test|dev):\/\/routine\/(\d{4}-\d{2}-\d{2})$/);
  if (!match) return false;
  try {
    dateFromKey(match[1]);
    return true;
  } catch {
    return false;
  }
}

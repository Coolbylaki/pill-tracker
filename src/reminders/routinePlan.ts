import type { Preferences } from '../data/preferences.ts';
import { validatePreferences } from '../data/preferences.ts';
import { dateFromKey } from '../utils/dates.ts';

export function routinePlan(
  preferences: Preferences,
  routineDate: string,
  now: Date,
  confirmed: boolean,
) {
  validatePreferences(preferences);
  if (confirmed || !preferences.remindersEnabled) return [];
  const routine = dateFromKey(routineDate);
  routine.setHours(preferences.routineHour, preferences.routineMinute, 0, 0);
  return [preferences.firstDelayMinutes, preferences.criticalDelayMinutes]
    .map((delay, index) => ({
      routineDate,
      sequence: index + 1,
      date: new Date(routine.getTime() + delay * 60_000),
    }))
    .filter((reminder) => reminder.date.getTime() > now.getTime());
}

export function routineTimeLabel(preferences: Preferences): string {
  const date = new Date(2024, 0, 1, preferences.routineHour, preferences.routineMinute);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function reminderTimeLabel(preferences: Preferences, delayMinutes: number): string {
  const date = new Date(2024, 0, 1, preferences.routineHour, preferences.routineMinute);
  const reminder = new Date(date.getTime() + delayMinutes * 60_000);
  const time = reminder.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${time}${reminder.getDate() !== date.getDate() ? ' (next day)' : ''}`;
}

import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import PillReminders from '../../modules/pill-reminders/src/PillRemindersModule';
import type { DailyReminderStatus } from '../../modules/pill-reminders/src/PillReminders.types';

export type { DailyReminderStatus };
export const hasDailyReminders =
  Platform.OS === 'android' && !isRunningInExpoGo() && PillReminders !== null;

const unavailable: DailyReminderStatus = {
  supported: false,
  enabled: false,
  notificationsAllowed: false,
  exactAllowed: false,
  scheduled: [],
  error: 'Install the updated Android app to enable daily reminders.',
};

export async function reconcileDailyReminders(): Promise<DailyReminderStatus> {
  return hasDailyReminders ? PillReminders!.reconcile() : unavailable;
}

export async function readDailyReminderStatus(): Promise<DailyReminderStatus> {
  return hasDailyReminders ? PillReminders!.getStatus() : unavailable;
}

export async function openDailyAlarmSettings(): Promise<boolean> {
  if (!hasDailyReminders) return false;
  await PillReminders!.openAlarmSettings();
  return true;
}

export interface DailyReminderStatus {
  supported: boolean;
  enabled: boolean;
  notificationsAllowed: boolean;
  exactAllowed: boolean;
  scheduled: { routineDate: string; sequence: number; at: string }[];
  error: string | null;
}

export interface PillRemindersNative {
  reconcile(): Promise<DailyReminderStatus>;
  getStatus(): Promise<DailyReminderStatus>;
  openAlarmSettings(): Promise<void>;
}

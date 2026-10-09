export interface DailyReminderStatus {
  supported: boolean;
  enabled: boolean;
  notificationsAllowed: boolean;
  exactAllowed: boolean;
  scheduled: { routineDate: string; sequence: number; at: string }[];
  error: string | null;
}

export interface PillRemindersNative {
  executeStorage(statements: string[]): Promise<void>;
  runStorage(sql: string, parameters: (string | null)[]): Promise<void>;
  queryStorage(sql: string, parameters: string[]): Promise<Record<string, unknown>[]>;
  reconcile(): Promise<DailyReminderStatus>;
  getStatus(): Promise<DailyReminderStatus>;
  openAlarmSettings(): Promise<void>;
}

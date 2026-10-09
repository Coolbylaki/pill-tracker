import type { PillRemindersNative } from '../../modules/pill-reminders/src/PillReminders.types';

// These batches contain only our schema SQL, which has no semicolons in string literals.
export function createNativeStorage(module: PillRemindersNative) {
  return {
    async execAsync(sql: string): Promise<void> {
      const statements = sql
        .split(';')
        .map((value) => value.trim())
        .filter(Boolean);
      await module.executeStorage(statements);
    },
    async runAsync(sql: string, ...parameters: (string | null)[]): Promise<void> {
      await module.runStorage(sql, parameters);
    },
    async getFirstAsync<T>(sql: string, ...parameters: string[]): Promise<T | null> {
      const rows = await module.queryStorage(sql, parameters);
      return (rows[0] as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...parameters: string[]): Promise<T[]> {
      return (await module.queryStorage(sql, parameters)) as T[];
    },
    async closeAsync(): Promise<void> {
      // Native calls own and close their connections; no JS connection stays open.
    },
  };
}

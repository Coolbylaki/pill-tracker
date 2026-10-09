export type ThemeMode = 'dark' | 'light';

export interface Preferences {
  theme: ThemeMode;
  routineHour: number;
  routineMinute: number;
  remindersEnabled: boolean;
  firstDelayMinutes: number;
  criticalDelayMinutes: number;
}

export const defaultPreferences: Preferences = {
  theme: 'dark',
  routineHour: 8,
  routineMinute: 0,
  remindersEnabled: true,
  firstDelayMinutes: 60,
  criticalDelayMinutes: 360,
};

export function validatePreferences(value: Preferences): void {
  if (
    !value ||
    !['dark', 'light'].includes(value.theme) ||
    typeof value.remindersEnabled !== 'boolean' ||
    !Number.isInteger(value.routineHour) ||
    value.routineHour < 0 ||
    value.routineHour > 23 ||
    !Number.isInteger(value.routineMinute) ||
    value.routineMinute < 0 ||
    value.routineMinute > 59 ||
    !Number.isInteger(value.firstDelayMinutes) ||
    value.firstDelayMinutes < 1 ||
    !Number.isInteger(value.criticalDelayMinutes) ||
    value.criticalDelayMinutes <= value.firstDelayMinutes ||
    value.criticalDelayMinutes > 1440
  )
    throw new Error(
      'Choose a valid pill time and reminder delays. The critical reminder must be later than the first, within 24 hours.',
    );
}

interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...parameters: string[]): Promise<unknown>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}

export async function initializePreferences(database: Database): Promise<void> {
  await database.execAsync(`CREATE TABLE IF NOT EXISTS app_preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version INTEGER NOT NULL,
    value TEXT NOT NULL
  );`);
}

export function createPreferencesRepository(database: Database) {
  return {
    async load(): Promise<Preferences | null> {
      const row = await database.getFirstAsync<{ version: number; value: string }>(
        'SELECT version, value FROM app_preferences WHERE id = 1',
      );
      if (!row) return null;
      if (row.version !== 1) throw new Error('Preferences belong to a different app version');
      const value: Preferences = JSON.parse(row.value);
      validatePreferences(value);
      return value;
    },
    async save(value: Preferences): Promise<void> {
      validatePreferences(value);
      await database.runAsync(
        'INSERT OR REPLACE INTO app_preferences (id, version, value) VALUES (1, 1, ?)',
        JSON.stringify(value),
      );
      const saved = await this.load();
      if (
        !saved ||
        (Object.keys(defaultPreferences) as (keyof Preferences)[]).some(
          (key) => saved[key] !== value[key],
        )
      )
        throw new Error('Your settings could not be verified. Please try saving again.');
    },
  };
}

export type PreferencesRepository = ReturnType<typeof createPreferencesRepository>;

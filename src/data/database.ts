import { openDatabaseAsync } from 'expo-sqlite';
import { createPillRepository, initializeDatabase } from './pills';
import { createPreferencesRepository, initializePreferences } from './preferences';

let storagePromise: Promise<AppStorage> | undefined;

export function getAppStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = openDatabaseAsync('pill-tracker.db')
      .then(async (database) => {
        try {
          await initializeDatabase(database);
          await initializePreferences(database);
          return {
            pills: createPillRepository(database),
            preferences: createPreferencesRepository(database),
          };
        } catch (error) {
          await database.closeAsync();
          throw error;
        }
      })
      .catch((error) => {
        storagePromise = undefined;
        throw error;
      });
  }
  return storagePromise;
}

export interface AppStorage {
  pills: ReturnType<typeof createPillRepository>;
  preferences: ReturnType<typeof createPreferencesRepository>;
}

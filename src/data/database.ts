import { openDatabaseAsync } from 'expo-sqlite';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import PillReminders from '../../modules/pill-reminders/src/PillRemindersModule';
import { createNativeStorage } from './nativeStorage';
import { createPillRepository, initializeDatabase } from './pills';
import { createPreferencesRepository, initializePreferences } from './preferences';

async function openStorage() {
  if (Platform.OS === 'android' && !isRunningInExpoGo() && PillReminders) {
    if (typeof PillReminders.queryStorage !== 'function')
      throw new Error('Install the updated Android app to use shared storage.');
    return createNativeStorage(PillReminders);
  }
  return openDatabaseAsync('pill-tracker.db');
}

let storagePromise: Promise<AppStorage> | undefined;

export function getAppStorage(): Promise<AppStorage> {
  if (!storagePromise) {
    storagePromise = openStorage()
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

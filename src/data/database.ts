import { openDatabaseAsync } from 'expo-sqlite';

import { createPillRepository, initializeDatabase, type PillRepository } from './pills';

let repositoryPromise: Promise<PillRepository> | undefined;

export function getPillRepository(): Promise<PillRepository> {
  if (!repositoryPromise) {
    repositoryPromise = openDatabaseAsync('pill-tracker.db')
      .then(async (database) => {
        try {
          await initializeDatabase(database);
          return createPillRepository(database);
        } catch (error) {
          await database.closeAsync();
          throw error;
        }
      })
      .catch((error) => {
        repositoryPromise = undefined;
        throw error;
      });
  }
  return repositoryPromise;
}

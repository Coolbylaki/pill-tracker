import { monthRange } from '../utils/calendar.ts';
import { localDateKey } from '../utils/dates.ts';

interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...parameters: string[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...parameters: string[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...parameters: string[]): Promise<T[]>;
}

export interface PillRecord {
  routineDate: string;
  takenAt: string;
}

export async function initializeDatabase(database: Database): Promise<void> {
  const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) {
    throw new Error('Database belongs to a newer app version');
  }
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    BEGIN TRANSACTION;
    CREATE TABLE IF NOT EXISTS pill_records (
      routine_date TEXT PRIMARY KEY NOT NULL,
      taken_at TEXT NOT NULL
    );
    PRAGMA user_version = 1;
    COMMIT;
  `);
}

export function createPillRepository(database: Database) {
  async function getRecord(routineDate: string): Promise<PillRecord | null> {
    return database.getFirstAsync<PillRecord>(
      'SELECT routine_date AS routineDate, taken_at AS takenAt FROM pill_records WHERE routine_date = ?',
      routineDate,
    );
  }

  async function getMonthRecords(month: Date): Promise<PillRecord[]> {
    const { start, end } = monthRange(month);
    return database.getAllAsync<PillRecord>(
      'SELECT routine_date AS routineDate, taken_at AS takenAt FROM pill_records WHERE routine_date >= ? AND routine_date < ? ORDER BY routine_date',
      start,
      end,
    );
  }

  async function confirm(now: Date): Promise<PillRecord> {
    const routineDate = localDateKey(now);
    await database.runAsync(
      'INSERT INTO pill_records (routine_date, taken_at) VALUES (?, ?) ON CONFLICT(routine_date) DO NOTHING',
      routineDate,
      now.toISOString(),
    );
    const record = await getRecord(routineDate);
    if (!record) throw new Error('Confirmation could not be read back');
    return record;
  }

  async function undo(record: PillRecord): Promise<void> {
    await database.runAsync(
      'DELETE FROM pill_records WHERE routine_date = ? AND taken_at = ?',
      record.routineDate,
      record.takenAt,
    );
  }

  return { getRecord, getMonthRecords, confirm, undo };
}

export type PillRepository = ReturnType<typeof createPillRepository>;

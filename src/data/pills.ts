import { monthRange } from '../utils/calendar.ts';
import { assertEditableDate, localDateKey } from '../utils/dates.ts';

interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...parameters: (string | null)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...parameters: string[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...parameters: string[]): Promise<T[]>;
}

export interface PillRecord {
  routineDate: string;
  takenAt: string | null;
  recordedAt: string;
}

export async function initializeDatabase(database: Database): Promise<void> {
  const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = version?.user_version ?? 0;
  if (currentVersion > 2) throw new Error('Database belongs to a newer app version');
  await database.execAsync('PRAGMA journal_mode = WAL;');
  if (currentVersion === 2) return;
  const createTable = `
    CREATE TABLE pill_records_v2 (
      routine_date TEXT PRIMARY KEY NOT NULL,
      taken_at TEXT,
      recorded_at TEXT NOT NULL
    );
  `;
  const migrateRecords =
    currentVersion === 1
      ? `
    INSERT INTO pill_records_v2 (routine_date, taken_at, recorded_at)
    SELECT routine_date, taken_at, taken_at FROM pill_records;
    DROP TABLE pill_records;
  `
      : '';
  await database.execAsync(`
    BEGIN TRANSACTION;
    ${createTable}
    ${migrateRecords}
    ALTER TABLE pill_records_v2 RENAME TO pill_records;
    PRAGMA user_version = 2;
    COMMIT;
  `);
}

export function createPillRepository(database: Database) {
  const columns = 'routine_date AS routineDate, taken_at AS takenAt, recorded_at AS recordedAt';

  async function getRecord(routineDate: string): Promise<PillRecord | null> {
    return database.getFirstAsync<PillRecord>(
      `SELECT ${columns} FROM pill_records WHERE routine_date = ?`,
      routineDate,
    );
  }

  async function getMonthRecords(month: Date): Promise<PillRecord[]> {
    const { start, end } = monthRange(month);
    return database.getAllAsync<PillRecord>(
      `SELECT ${columns} FROM pill_records WHERE routine_date >= ? AND routine_date < ? ORDER BY routine_date`,
      start,
      end,
    );
  }

  async function insertRecord(
    routineDate: string,
    takenAt: string | null,
    recordedAt: string,
  ): Promise<PillRecord> {
    await database.runAsync(
      'INSERT OR IGNORE INTO pill_records (routine_date, taken_at, recorded_at) VALUES (?, ?, ?)',
      routineDate,
      takenAt,
      recordedAt,
    );
    const record = await getRecord(routineDate);
    if (!record) throw new Error('Confirmation could not be read back');
    return record;
  }

  async function confirm(now: Date): Promise<PillRecord> {
    return insertRecord(localDateKey(now), now.toISOString(), now.toISOString());
  }

  async function markDateTaken(routineDate: string, now: Date): Promise<PillRecord> {
    assertEditableDate(routineDate, now);
    return insertRecord(routineDate, null, now.toISOString());
  }

  async function undo(record: PillRecord, now?: Date): Promise<void> {
    if (now) assertEditableDate(record.routineDate, now);
    await database.runAsync(
      'DELETE FROM pill_records WHERE routine_date = ? AND recorded_at = ?',
      record.routineDate,
      record.recordedAt,
    );
  }

  return { getRecord, getMonthRecords, confirm, markDateTaken, undo };
}

export type PillRepository = ReturnType<typeof createPillRepository>;

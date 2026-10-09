import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createPillRepository, initializeDatabase } from '../src/data/pills.ts';
import { localDateKey } from '../src/utils/dates.ts';

function adapter(database) {
  return {
    async execAsync(sql) {
      database.exec(sql);
    },
    async runAsync(sql, ...parameters) {
      return database.prepare(sql).run(...parameters);
    },
    async getFirstAsync(sql, ...parameters) {
      return database.prepare(sql).get(...parameters) ?? null;
    },
  };
}

test('confirmation persists across reopening and repeated taps preserve the first timestamp', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pill-tracker-test-'));
  const path = join(directory, 'records.db');
  let database = new DatabaseSync(path);
  try {
    await initializeDatabase(adapter(database));
    const repository = createPillRepository(adapter(database));
    const first = new Date(2026, 9, 9, 8, 12);
    const saved = await repository.confirm(first);
    const duplicate = await repository.confirm(new Date(2026, 9, 9, 9, 0));
    assert.equal(duplicate.takenAt, first.toISOString());
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM pill_records').get().count, 1);
    database.close();
    database = new DatabaseSync(path);
    await initializeDatabase(adapter(database));
    const reloaded = await createPillRepository(adapter(database)).getRecord('2026-10-09');
    assert.deepEqual({ ...reloaded }, { ...saved });
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('undo affects only the chosen date and does not remove a newer replacement record', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    await initializeDatabase(adapter(database));
    const repository = createPillRepository(adapter(database));
    await repository.confirm(new Date(2026, 9, 8, 8));
    const record = await repository.confirm(new Date(2026, 9, 9, 8));
    await repository.undo(record);
    assert.equal(await repository.getRecord('2026-10-09'), null);
    assert.ok(await repository.getRecord('2026-10-08'));
    await repository.confirm(new Date(2026, 9, 9, 9));
    await repository.undo(record);
    assert.ok(await repository.getRecord('2026-10-09'));
  } finally {
    database.close();
  }
});

test('dates use local calendar fields near midnight and across month/year boundaries', () => {
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 1)), '2026-01-01');
  assert.equal(localDateKey(new Date(2026, 9, 9, 23, 59)), '2026-10-09');
  assert.equal(localDateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.equal(localDateKey(new Date(2027, 0, 1, 0, 0)), '2027-01-01');
});

test('the same instant is recorded against the correct local day in different time zones', () => {
  const moduleUrl = new URL('../src/utils/dates.ts', import.meta.url).href;
  const code = `import { localDateKey } from ${JSON.stringify(moduleUrl)}; console.log(localDateKey(new Date('2026-01-01T00:15:00Z')));`;
  for (const [zone, expected] of [
    ['UTC', '2026-01-01'],
    ['Europe/Belgrade', '2026-01-01'],
    ['America/Los_Angeles', '2025-12-31'],
  ]) {
    const actual = execFileSync(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '-e', code],
      { env: { ...process.env, TZ: zone }, encoding: 'utf8' },
    );
    assert.equal(actual.trim(), expected);
  }
});

test('a newer database version is rejected without modifying its records', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec(
      "PRAGMA user_version = 2; CREATE TABLE sentinel (value TEXT); INSERT INTO sentinel VALUES ('keep');",
    );
    await assert.rejects(initializeDatabase(adapter(database)), /newer app version/);
    assert.equal(database.prepare('PRAGMA user_version').get().user_version, 2);
    assert.equal(database.prepare('SELECT value FROM sentinel').get().value, 'keep');
  } finally {
    database.close();
  }
});

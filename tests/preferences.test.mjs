import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import {
  createPreferencesRepository,
  defaultPreferences,
  initializePreferences,
  validatePreferences,
} from '../src/data/preferences.ts';
import { createPillRepository, initializeDatabase } from '../src/data/pills.ts';
import { routinePlan } from '../src/reminders/routinePlan.ts';

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
    async getAllAsync(sql, ...parameters) {
      return database.prepare(sql).all(...parameters);
    },
  };
}

test('first launch has no completed setup; saving preferences preserves existing pill history', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pill-preferences-test-'));
  const databasePath = join(directory, 'settings.db');
  let db = new DatabaseSync(databasePath);
  try {
    const storage = adapter(db);
    await initializeDatabase(storage);
    const pills = createPillRepository(storage);
    const record = await pills.confirm(new Date(2026, 9, 9, 8, 12));
    await initializePreferences(storage);
    const settings = createPreferencesRepository(storage);
    assert.equal(await settings.load(), null);
    const preferences = {
      ...defaultPreferences,
      theme: 'light',
      routineHour: 21,
      routineMinute: 30,
      firstDelayMinutes: 90,
      criticalDelayMinutes: 420,
    };
    await settings.save(preferences);
    db.close();
    db = new DatabaseSync(databasePath);
    await initializeDatabase(adapter(db));
    await initializePreferences(adapter(db));
    const reopened = createPreferencesRepository(adapter(db));
    assert.deepEqual(await reopened.load(), preferences);
    assert.deepEqual(
      { ...(await createPillRepository(adapter(db)).getRecord('2026-10-09')) },
      { ...record },
    );
    await assert.rejects(reopened.save({ ...preferences, criticalDelayMinutes: 30 }));
    assert.deepEqual(await reopened.load(), preferences);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('preferences reject invalid times and delays before any update', () => {
  for (const change of [
    { routineHour: 24 },
    { routineMinute: -1 },
    { theme: 'unknown' },
    { remindersEnabled: 'yes' },
    { firstDelayMinutes: 0 },
    { criticalDelayMinutes: 60 },
    { criticalDelayMinutes: 1441 },
    { firstDelayMinutes: 60.5 },
  ]) {
    assert.throws(() => validatePreferences({ ...defaultPreferences, ...change }));
  }
});

test('late setup never replays overdue reminders and confirmed days schedule nothing', () => {
  const now = new Date(2026, 9, 9, 17);
  assert.deepEqual(routinePlan(defaultPreferences, '2026-10-09', now, false), []);
  assert.deepEqual(
    routinePlan(defaultPreferences, '2026-10-09', new Date(2026, 9, 9, 8), true),
    [],
  );
  const tomorrow = routinePlan(defaultPreferences, '2026-10-10', now, false);
  assert.deepEqual(
    tomorrow.map((item) => item.date.getHours()),
    [9, 14],
  );
  assert.deepEqual(
    tomorrow.map((item) => item.routineDate),
    ['2026-10-10', '2026-10-10'],
  );
});

test('only future times remain after late setup; disabling reminders suppresses the plan', () => {
  const now = new Date(2026, 9, 9, 10);
  const plan = routinePlan(defaultPreferences, '2026-10-09', now, false);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].sequence, 2);
  assert.equal(plan[0].date.getHours(), 14);
  assert.deepEqual(
    routinePlan({ ...defaultPreferences, remindersEnabled: false }, '2026-10-09', now, false),
    [],
  );
  assert.equal(
    routinePlan(defaultPreferences, '2026-10-09', new Date(2026, 9, 9, 14), false).length,
    0,
  );
});

test('evening reminders retain the originating routine date across midnight', () => {
  const plan = routinePlan(
    { ...defaultPreferences, routineHour: 23, routineMinute: 30 },
    '2026-12-31',
    new Date(2026, 11, 31, 20),
    false,
  );
  assert.deepEqual(
    plan.map((item) => [
      item.routineDate,
      item.date.getFullYear(),
      item.date.getMonth(),
      item.date.getDate(),
      item.date.getHours(),
      item.date.getMinutes(),
    ]),
    [
      ['2026-12-31', 2027, 0, 1, 0, 30],
      ['2026-12-31', 2027, 0, 1, 5, 30],
    ],
  );
});

test('updating existing settings persists light theme, disabled reminders, and five-hour critical delay', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'pill-settings-update-'));
  const path = join(directory, 'settings.db');
  let db = new DatabaseSync(path);
  try {
    await initializeDatabase(adapter(db));
    await initializePreferences(adapter(db));
    const repository = createPreferencesRepository(adapter(db));
    await repository.save(defaultPreferences);
    const updated = {
      ...defaultPreferences,
      theme: 'light',
      remindersEnabled: false,
      criticalDelayMinutes: 300,
    };
    await repository.save(updated);
    assert.deepEqual(await repository.load(), updated);
    db.close();
    db = new DatabaseSync(path);
    assert.deepEqual(await createPreferencesRepository(adapter(db)).load(), updated);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('settings save rejects a write that resolves without storing the requested values', async () => {
  const repository = createPreferencesRepository({
    async runAsync() {},
    async getFirstAsync() {
      return { version: 1, value: JSON.stringify(defaultPreferences) };
    },
  });
  await assert.rejects(
    repository.save({ ...defaultPreferences, theme: 'light' }),
    /could not be verified/,
  );
});

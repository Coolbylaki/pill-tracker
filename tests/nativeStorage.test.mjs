import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNativeStorage } from '../src/data/nativeStorage.ts';

test('native storage preserves schema batches, bound nulls, and rows across the bridge', async () => {
  const calls = [];
  const rows = [{ routineDate: '2026-10-09', takenAt: null, recordedAt: 'test' }];
  const storage = createNativeStorage({
    async executeStorage(statements) {
      calls.push(statements);
    },
    async runStorage(sql, parameters) {
      calls.push([sql, parameters]);
    },
    async queryStorage(sql, parameters) {
      calls.push([sql, parameters]);
      return rows;
    },
  });
  await storage.execAsync(' BEGIN TRANSACTION; CREATE TABLE records (date TEXT); COMMIT; ');
  assert.deepEqual(calls.shift(), [
    'BEGIN TRANSACTION',
    'CREATE TABLE records (date TEXT)',
    'COMMIT',
  ]);
  await storage.runAsync('INSERT INTO records VALUES (?, ?)', '2026-10-09', null);
  assert.deepEqual(calls.shift(), ['INSERT INTO records VALUES (?, ?)', ['2026-10-09', null]]);
  assert.deepEqual(
    await storage.getFirstAsync('SELECT * FROM records WHERE date = ?', '2026-10-09'),
    rows[0],
  );
  assert.deepEqual(calls.shift(), ['SELECT * FROM records WHERE date = ?', ['2026-10-09']]);
  assert.deepEqual(await storage.getAllAsync('SELECT * FROM records'), rows);
});

test('native storage propagates failures and returns null for an empty result', async () => {
  const storage = createNativeStorage({
    async executeStorage() {
      throw new Error('storage failed');
    },
    async runStorage() {
      throw new Error('storage failed');
    },
    async queryStorage() {
      return [];
    },
  });
  assert.equal(await storage.getFirstAsync('SELECT value'), null);
  await assert.rejects(storage.execAsync('CREATE TABLE records (date TEXT)'), /storage failed/);
  await assert.rejects(
    storage.runAsync('UPDATE records SET date = ?', '2026-10-09'),
    /storage failed/,
  );
});

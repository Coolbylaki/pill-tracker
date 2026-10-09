import assert from 'node:assert/strict';
import { test } from 'node:test';

import { armTests, cancelTests, makeTestPlan, TEST_KIND } from '../src/reminders/testPlan.ts';

function scheduler(initial = [], failSecond = false) {
  const pending = [...initial];
  let sequence = 0;
  return {
    pending,
    async list() {
      return pending;
    },
    async cancel(identifier) {
      const index = pending.findIndex((item) => item.identifier === identifier);
      if (index >= 0) pending.splice(index, 1);
    },
    async schedule(reminder) {
      if (failSecond && reminder.sequence === 2) throw new Error('Scheduling failed');
      const identifier = `test-${++sequence}`;
      pending.push({ identifier, kind: TEST_KIND, routineDate: reminder.routineDate });
      return identifier;
    },
  };
}

test('test pairs have two native dates and tomorrow uses its own routine date across a year boundary', () => {
  const now = new Date(2026, 11, 31, 10);
  const current = makeTestPlan(now);
  assert.deepEqual(
    current.map((item) => item.date.getTime() - now.getTime()),
    [30_000, 90_000],
  );
  const tomorrow = makeTestPlan(now, true);
  assert.equal(tomorrow[0].routineDate, '2027-01-01');
  assert.equal(tomorrow[0].date.getDate(), 1);
});

test('confirmation cancels only the selected routine date and leaves other notifications intact', async () => {
  const adapter = scheduler([
    { identifier: 'today', kind: TEST_KIND, routineDate: '2026-10-09' },
    { identifier: 'tomorrow', kind: TEST_KIND, routineDate: '2026-10-10' },
    { identifier: 'other', kind: 'unrelated', routineDate: '2026-10-09' },
  ]);
  assert.equal(await cancelTests(adapter, '2026-10-09'), 1);
  assert.deepEqual(
    adapter.pending.map((item) => item.identifier),
    ['tomorrow', 'other'],
  );
  assert.equal(await cancelTests(adapter), 1);
  assert.equal(adapter.pending[0].identifier, 'other');
});

test('rearming replaces the existing pair rather than accumulating reminders', async () => {
  const adapter = scheduler();
  const now = new Date(2026, 9, 9, 10);
  await armTests(adapter, now);
  await armTests(adapter, now);
  assert.equal(adapter.pending.length, 2);
  await armTests(adapter, now, true);
  assert.equal(adapter.pending.length, 4);
});

test('a failed second scheduling request removes the partially created pair', async () => {
  const adapter = scheduler([], true);
  await assert.rejects(armTests(adapter, new Date(2026, 9, 9, 10)), /Scheduling failed/);
  assert.equal(adapter.pending.length, 0);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reminderRoutineFromUrl } from '../src/reminders/notificationRoute.ts';

test('notification routes preserve the original routine date and reject malformed links', () => {
  assert.equal(reminderRoutineFromUrl('pill-tracker-test://routine/2026-12-31'), '2026-12-31');
  assert.equal(reminderRoutineFromUrl('pill-tracker-dev://routine/2026-10-09'), '2026-10-09');
  for (const url of [
    null,
    'https://example.com/routine/2026-10-09',
    'pill-tracker-test://routine/2026-02-30',
    'pill-tracker-test://routine/2026-10-09/confirm',
  ]) {
    assert.equal(reminderRoutineFromUrl(url), null);
  }
});

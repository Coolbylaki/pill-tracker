import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reminderOpensHome } from '../src/reminders/notificationRoute.ts';

test('widget and notification links open Home, including dated links from earlier APKs', () => {
  assert.equal(reminderOpensHome('pill-tracker-test://home'), true);
  assert.equal(reminderOpensHome('pill-tracker-dev://home'), true);
  assert.equal(reminderOpensHome('pill-tracker-test://routine/2026-12-31'), true);
  assert.equal(reminderOpensHome('pill-tracker-dev://routine/2026-10-09'), true);
  for (const url of [
    null,
    'https://example.com/routine/2026-10-09',
    'pill-tracker-test://routine/2026-02-30',
    'pill-tracker-test://routine/2026-10-09/confirm',
    'pill-tracker-test://home/confirm',
    'https://example.com/home',
  ]) {
    assert.equal(reminderOpensHome(url), false);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calendarWeeks, monthRange, shiftMonth } from '../src/utils/calendar.ts';

test('Monday-first grid puts October 2026 on Thursday and contains every date once', () => {
  const weeks = calendarWeeks(new Date(2026, 9, 9));
  assert.equal(weeks.length, 5);
  assert.deepEqual(
    weeks[0].map((day) => day?.number ?? null),
    [null, null, null, 1, 2, 3, 4],
  );
  const dates = weeks
    .flat()
    .filter(Boolean)
    .map((day) => day.dateKey);
  assert.equal(dates.length, 31);
  assert.equal(new Set(dates).size, 31);
  assert.equal(dates[0], '2026-10-01');
  assert.equal(dates.at(-1), '2026-10-31');
});

test('leap years and six-row months produce the correct calendar layout', () => {
  const leapDays = calendarWeeks(new Date(2024, 1, 1))
    .flat()
    .filter(Boolean);
  assert.equal(leapDays.length, 29);
  assert.equal(leapDays.at(-1).dateKey, '2024-02-29');
  assert.equal(
    calendarWeeks(new Date(2026, 1, 1))
      .flat()
      .filter(Boolean).length,
    28,
  );
  const sixRows = calendarWeeks(new Date(2026, 2, 1));
  assert.equal(sixRows.length, 6);
  assert.equal(sixRows[0][6].number, 1);
  assert.equal(sixRows[5][1].number, 31);
});

test('month navigation handles end-of-month dates and year boundaries', () => {
  const next = shiftMonth(new Date(2026, 0, 31), 1);
  assert.equal(next.getMonth(), 1);
  assert.equal(next.getDate(), 1);
  assert.deepEqual(monthRange(new Date(2026, 11, 20)), { start: '2026-12-01', end: '2027-01-01' });
  assert.deepEqual(monthRange(shiftMonth(new Date(2027, 0, 1), -1)), {
    start: '2026-12-01',
    end: '2027-01-01',
  });
});

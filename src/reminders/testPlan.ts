import { localDateKey } from '../utils/dates.ts';

export const TEST_KIND = 'pill-tracker-reminder-test-v1';

export interface TestReminder {
  date: Date;
  routineDate: string;
  sequence: number;
}

export interface PendingReminder {
  identifier: string;
  kind: unknown;
  routineDate: unknown;
}

export interface TestScheduler {
  list(): Promise<PendingReminder[]>;
  schedule(reminder: TestReminder): Promise<string>;
  cancel(identifier: string): Promise<void>;
}

export function makeTestPlan(now: Date, tomorrow = false): TestReminder[] {
  const base = new Date(now);
  if (tomorrow) base.setDate(base.getDate() + 1);
  const routineDate = localDateKey(base);
  return [30, 90].map((seconds, index) => ({
    date: new Date(base.getTime() + seconds * 1000),
    routineDate,
    sequence: index + 1,
  }));
}

export async function cancelTests(scheduler: TestScheduler, routineDate?: string): Promise<number> {
  const pending = (await scheduler.list()).filter(
    (item) =>
      item.kind === TEST_KIND && (routineDate === undefined || item.routineDate === routineDate),
  );
  await Promise.all(pending.map((item) => scheduler.cancel(item.identifier)));
  return pending.length;
}

export async function armTests(
  scheduler: TestScheduler,
  now: Date,
  tomorrow = false,
): Promise<TestReminder[]> {
  const plan = makeTestPlan(now, tomorrow);
  await cancelTests(scheduler, plan[0].routineDate);
  const scheduled: string[] = [];
  try {
    for (const reminder of plan) scheduled.push(await scheduler.schedule(reminder));
    return plan;
  } catch (error) {
    await Promise.all(scheduled.map((identifier) => scheduler.cancel(identifier)));
    throw error;
  }
}

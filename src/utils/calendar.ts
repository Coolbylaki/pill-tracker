import { localDateKey } from './dates.ts';

export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}

export function monthRange(date: Date): { start: string; end: string } {
  return { start: localDateKey(monthStart(date)), end: localDateKey(shiftMonth(date, 1)) };
}

export interface CalendarDay {
  dateKey: string;
  number: number;
  date: Date;
}

export function calendarWeeks(month: Date): (CalendarDay | null)[][] {
  const first = monthStart(month);
  const offset = (first.getDay() + 6) % 7;
  const totalDays = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12).getDate();
  const cells = Array.from({ length: Math.ceil((offset + totalDays) / 7) * 7 }, (_, index) => {
    const number = index - offset + 1;
    if (number < 1 || number > totalDays) return null;
    const date = new Date(first.getFullYear(), first.getMonth(), number, 12);
    return { dateKey: localDateKey(date), number, date };
  });
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

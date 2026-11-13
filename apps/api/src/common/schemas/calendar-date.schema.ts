import { z } from 'zod';

const EARLIEST_DATE = '2000-01-01';
const LATEST_UTC_OFFSET_MS = 14 * 60 * 60 * 1000;

export function latestCalendarDate(now: Date = new Date()): string {
  return new Date(now.getTime() + LATEST_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format')
  .refine(isRealDate, 'must be a valid calendar date')
  .refine((value) => value >= EARLIEST_DATE, `must not be earlier than ${EARLIEST_DATE}`)
  .refine((value) => value <= latestCalendarDate(), 'must not be in the future');

export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function fromDbDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

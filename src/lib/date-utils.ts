import { format } from 'date-fns';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

const MELBOURNE_TZ = 'Australia/Melbourne';

/**
 * Gets the current date in Melbourne timezone as YYYY-MM-DD.
 */
export function getTodayDateKey(): string {
  const now = new Date();
  return formatInTimeZone(now, MELBOURNE_TZ, 'yyyy-MM-dd');
}

/**
 * Gets the current datetime in Melbourne timezone.
 */
export function getMelbourneNow(): Date {
  return utcToZonedTime(new Date(), MELBOURNE_TZ);
}

/**
 * Parses a date key (YYYY-MM-DD) and returns a Date object in Melbourne time.
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return utcToZonedTime(date, MELBOURNE_TZ);
}

/**
 * Formats a date for display.
 */
export function formatDateForDisplay(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return format(date, 'MMMM d, yyyy');
}

/**
 * Checks if a date key is today in Melbourne time.
 */
export function isToday(dateKey: string): boolean {
  return dateKey === getTodayDateKey();
}

/**
 * Checks if a date key is in the past (before today in Melbourne time).
 */
export function isPast(dateKey: string): boolean {
  const today = getTodayDateKey();
  return dateKey < today;
}

/**
 * Checks if a date key is in the future (after today in Melbourne time).
 */
export function isFuture(dateKey: string): boolean {
  const today = getTodayDateKey();
  return dateKey > today;
}

/**
 * Gets the date key for N days ago/ahead from today.
 */
export function getDateKeyOffset(days: number): string {
  const now = getMelbourneNow();
  const target = new Date(now);
  target.setDate(target.getDate() + days);
  return format(target, 'yyyy-MM-dd');
}

/**
 * Calculates the puzzle number based on date (days since launch).
 */
export function getPuzzleNumber(dateKey: string): number {
  const launchDate = new Date('2024-01-01');
  const targetDate = parseDateKey(dateKey);
  const diffTime = targetDate.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Gets midnight in Melbourne time for the next day (for scheduling).
 */
export function getNextMidnightMelbourne(): Date {
  const now = getMelbourneNow();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Gets the time until next midnight in Melbourne (in milliseconds).
 */
export function getTimeUntilNextMidnightMelbourne(): number {
  const now = new Date();
  const melbourneNow = utcToZonedTime(now, MELBOURNE_TZ);
  const nextMidnight = new Date(melbourneNow);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  return nextMidnight.getTime() - melbourneNow.getTime();
}

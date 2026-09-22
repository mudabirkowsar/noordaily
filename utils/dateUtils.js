
// utils/dateUtils.js

import {
  format,
  parseISO,
  isValid,
  differenceInCalendarDays,
  startOfYear,
} from 'date-fns';

/**
 * Formats a Date object as 'yyyy-MM-dd',
 * matching the /day/[date] route param.
 */
export function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a 'yyyy-MM-dd' route param back into a Date object.
 * Falls back to today if the string is invalid.
 */
export function fromDateKey(dateKey) {
  try {
    if (!dateKey || typeof dateKey !== 'string') {
      return new Date();
    }

    const parsed = parseISO(dateKey);

    if (isValid(parsed)) {
      return parsed;
    }
  } catch (e) {
    // Fall through to today.
  }

  return new Date();
}

/**
 * Returns a 1-based "day index" for the year.
 *
 * Jan 1st => 1
 * Jan 2nd => 2
 * etc.
 */
export function getDayOfYearIndex(date) {
  const safeDate = date instanceof Date && isValid(date)
    ? date
    : new Date();

  const start = startOfYear(safeDate);

  return differenceInCalendarDays(safeDate, start) + 1;
}

/**
 * Human friendly long date.
 *
 * Example:
 * Saturday, September 19
 */
export function formatLongDate(date) {
  const safeDate = date instanceof Date && isValid(date)
    ? date
    : new Date();

  return format(safeDate, 'EEEE, MMMM d');
}

/**
 * Human friendly full date with year.
 *
 * Example:
 * September 19, 2026
 */
export function formatFullDate(date) {
  const safeDate = date instanceof Date && isValid(date)
    ? date
    : new Date();

  return format(safeDate, 'MMMM d, yyyy');
}

/**
 * Formats a time safely.
 *
 * Supported formats:
 *
 * formatTime({ hour: 8, minute: 30 })
 *        -> "08:30 AM"
 *
 * formatTime("08:30")
 *        -> "08:30 AM"
 *
 * formatTime("18:30")
 *        -> "06:30 PM"
 *
 * Invalid values fall back to "08:00 AM".
 */
export function formatTime(value) {
  let hour;
  let minute;

  /**
   * Case 1:
   * Object:
   * { hour: 8, minute: 30 }
   */
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    hour = Number(value.hour);
    minute = Number(value.minute);
  }

  /**
   * Case 2:
   * String:
   * "08:30"
   * "18:30"
   */
  else if (typeof value === 'string') {
    const trimmed = value.trim();

    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

    if (match) {
      hour = Number(match[1]);
      minute = Number(match[2]);
    }
  }

  /**
   * Case 3:
   * Date object.
   */
  else if (value instanceof Date) {
    if (isValid(value)) {
      hour = value.getHours();
      minute = value.getMinutes();
    }
  }

  /**
   * Validate hour/minute.
   */
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    // Safe fallback.
    hour = 8;
    minute = 0;
  }

  const d = new Date();

  d.setHours(hour, minute, 0, 0);

  /**
   * Extra safety check.
   */
  if (!isValid(d)) {
    const fallback = new Date();

    fallback.setHours(8, 0, 0, 0);

    return format(fallback, 'hh:mm a');
  }

  return format(d, 'hh:mm a');
}

export default {
  toDateKey,
  fromDateKey,
  getDayOfYearIndex,
  formatLongDate,
  formatFullDate,
  formatTime,
};

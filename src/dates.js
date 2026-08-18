// Dates keep the precision of their source: 'YYYY', 'YYYY-MM' or
// 'YYYY-MM-DD'. A day is never invented. For comparison and arithmetic a date
// is normalised to the first day of its precision; for display it is not.

export const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function precisionOf(value) {
  return { 4: 'year', 7: 'month', 10: 'day' }[value.length] ?? null;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1970 || year > 2100) return false;
  if (month !== undefined && (month < 1 || month > 12)) return false;
  if (day === undefined) return true;
  const max = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= max;
}

// Normalises to the first day of the given precision. A start date is
// inclusive, an end date exclusive; both are treated the same way here.
export function toDate(value) {
  const [year, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function compareDates(a, b) {
  return toDate(a).getTime() - toDate(b).getTime();
}

export function monthsBetween(start, end) {
  const from = toDate(start);
  const to = toDate(end);
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12
    + (to.getUTCMonth() - from.getUTCMonth());
}

// Shows how precise the entry really is. A year stays a year - padding it out
// to "1 January" would claim knowledge the source does not carry.
export function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  if (month === undefined) return String(year);
  if (day === undefined) return `${MONTH_NAMES[month - 1]} ${year}`;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

// Durations are rounded to whole months below a year and to one decimal above.
// The underlying dates are often year-precise, so anything finer would be
// false precision.
export function formatDuration(months) {
  if (months < 1) return 'under a month';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = months / 12;
  const rounded = Math.round(years * 10) / 10;
  return `${rounded} year${rounded === 1 ? '' : 's'}`;
}

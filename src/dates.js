// Datumsangaben behalten die Praezision ihrer Quelle: 'YYYY', 'YYYY-MM' oder
// 'YYYY-MM-DD'. Es wird nie ein Tag erfunden. Fuer Vergleiche und Rechnungen
// wird auf den ersten Tag normalisiert, fuer die Anzeige nicht.

export const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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

// Normalisiert auf den ersten Tag der angegebenen Praezision. Ein Startdatum
// ist inklusiv, ein Enddatum exklusiv - beide werden gleich behandelt.
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

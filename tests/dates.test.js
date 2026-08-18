import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  compareDates, formatDate, formatDuration, isValidDate, monthsBetween, precisionOf
} from '../src/dates.js';

test('recognises the three permitted precisions', () => {
  assert.equal(precisionOf('2015'), 'year');
  assert.equal(precisionOf('2015-03'), 'month');
  assert.equal(precisionOf('2015-03-09'), 'day');
});

test('rejects malformed values', () => {
  for (const value of ['15', '2015-3', '2015/03', '2015-03-09T00:00:00Z', '', 'soon']) {
    assert.equal(isValidDate(value), false, `${JSON.stringify(value)} should have been rejected`);
  }
});

test('rejects calendar dates that do not exist', () => {
  assert.equal(isValidDate('2015-13'), false);
  assert.equal(isValidDate('2015-00'), false);
  assert.equal(isValidDate('2015-02-29'), false);
  assert.equal(isValidDate('2016-02-29'), true, '2016 was a leap year');
  assert.equal(isValidDate('2000-02-29'), true, '2000 was a leap year');
  assert.equal(isValidDate('1900-02-29'), false, '1900 was not');
  assert.equal(isValidDate('2015-04-31'), false);
});

test('compares across precision boundaries', () => {
  assert.ok(compareDates('2015', '2015-03') < 0, 'the start of the year precedes March');
  assert.equal(compareDates('2015', '2015-01-01'), 0, 'both mean 1 January');
  assert.ok(compareDates('2021-01-18', '2021-02-22') < 0);
});

test('counts months between two dates', () => {
  assert.equal(monthsBetween('2021-01', '2021-02'), 1);
  assert.equal(monthsBetween('2017', '2021'), 48);
  assert.equal(monthsBetween('2021-01-18', '2021-01-30'), 0, 'within one month');
});

test('formatting keeps the precision of the entry', () => {
  assert.equal(formatDate('2015'), '2015');
  assert.equal(formatDate('2021-01'), 'January 2021');
  assert.equal(formatDate('2023-03-08'), '8 March 2023');
});

test('durations stay as coarse as the underlying dates', () => {
  assert.equal(formatDuration(0), 'under a month');
  assert.equal(formatDuration(1), '1 month');
  assert.equal(formatDuration(11), '11 months');
  assert.equal(formatDuration(12), '1 year');
  assert.equal(formatDuration(48), '4 years');
  assert.equal(formatDuration(30), '2.5 years');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareDates, isValidDate, monthsBetween, precisionOf } from '../src/dates.js';

test('erkennt die drei zulaessigen Praezisionen', () => {
  assert.equal(precisionOf('2015'), 'year');
  assert.equal(precisionOf('2015-03'), 'month');
  assert.equal(precisionOf('2015-03-09'), 'day');
});

test('weist unzulaessige Formen ab', () => {
  for (const value of ['15', '2015-3', '2015/03', '2015-03-09T00:00:00Z', '', 'demnaechst']) {
    assert.equal(isValidDate(value), false, `${JSON.stringify(value)} haette abgewiesen werden muessen`);
  }
});

test('weist Kalenderdaten ab, die es nicht gibt', () => {
  assert.equal(isValidDate('2015-13'), false);
  assert.equal(isValidDate('2015-00'), false);
  assert.equal(isValidDate('2015-02-29'), false);
  assert.equal(isValidDate('2016-02-29'), true, '2016 war ein Schaltjahr');
  assert.equal(isValidDate('2000-02-29'), true, '2000 war ein Schaltjahr');
  assert.equal(isValidDate('1900-02-29'), false, '1900 war keines');
  assert.equal(isValidDate('2015-04-31'), false);
});

test('vergleicht ueber Praezisionsgrenzen hinweg', () => {
  assert.ok(compareDates('2015', '2015-03') < 0, 'Jahresbeginn liegt vor Maerz');
  assert.equal(compareDates('2015', '2015-01-01'), 0, 'beide meinen den 1. Januar');
  assert.ok(compareDates('2021-01-18', '2021-02-22') < 0);
});

test('zaehlt Monate zwischen zwei Daten', () => {
  assert.equal(monthsBetween('2021-01', '2021-02'), 1);
  assert.equal(monthsBetween('2017', '2021'), 48);
  assert.equal(monthsBetween('2021-01-18', '2021-01-30'), 0, 'innerhalb eines Monats');
});

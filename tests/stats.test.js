import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRegistry } from '../src/model.js';
import {
  assimilationStats, familyStats, lifetimeStats, median, nameLifetimes, riskIndex, waveStats
} from '../src/stats.js';

// Two products, chosen so every branch of the statistics has a case: one
// organic product renamed twice, one acquired product that took the SAP name
// and has never been renamed since.
function data() {
  return {
    asOf: '2026-01-01',
    sources: [
      { id: 'src-a', title: 'A', publisher: 'X', url: 'https://example.org/a', type: 'first-party' }
    ],
    products: [
      {
        id: 'product-alpha',
        emoji: '🧪',
        currentName: 'Alpha Three',
        family: 'platform-dev',
        origin: 'organic',
        periods: [
          { name: 'Alpha One', start: '2014-01', end: '2016-01', qualifier: 'launch', sources: ['src-a'] },
          { name: 'Alpha Two', start: '2016-01', end: '2020-01', qualifier: 'effective', transition: 'rename', sources: ['src-a'] },
          { name: 'Alpha Three', start: '2020-01', qualifier: 'effective', transition: 'rename', wave: 'big-2020', sources: ['src-a'] }
        ]
      },
      {
        id: 'product-beta',
        emoji: '🧭',
        currentName: 'SAP Beta',
        family: 'cx',
        origin: 'acquired',
        acquiredFrom: 'Beta Inc.',
        acquisitionDate: '2018-03',
        periods: [
          { name: 'Beta', start: '2018-03', end: '2020-01', qualifier: 'by', sources: ['src-a'] },
          { name: 'SAP Beta', start: '2020-01', qualifier: 'by', transition: 'assimilation', wave: 'big-2020', sources: ['src-a'] }
        ]
      }
    ]
  };
}

const registry = () => buildRegistry(data());

test('median handles both parities and an empty list', () => {
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test('a period is ended by the transition of the period after it', () => {
  const lifetimes = nameLifetimes(registry().products);
  const byName = new Map(lifetimes.map(entry => [entry.period.name, entry]));

  assert.equal(byName.get('Alpha One').endedBy, 'rename');
  assert.equal(byName.get('Alpha Two').endedBy, 'rename');
  assert.equal(byName.get('Alpha Three').endedBy, 'running');
  // Ended, but not by a rename - it must not reach the median.
  assert.equal(byName.get('Beta').endedBy, 'assimilation');
});

test('the median counts renames only, and running names are censored not zero', () => {
  const stats = lifetimeStats(registry().products);

  assert.deepEqual(stats.renamed.map(entry => entry.months), [24, 48]);
  assert.equal(stats.median, 36);
  assert.equal(stats.shortest.period.name, 'Alpha One');
  assert.equal(stats.longest.period.name, 'Alpha Two');
  assert.equal(stats.censored, 2);
  assert.equal(stats.medianRunning, 72);
});

test('family figures land in the right family and flag thin evidence', () => {
  const byFamily = new Map(familyStats(registry().products).map(row => [row.family, row]));

  assert.equal(byFamily.get('platform-dev').renames, 2);
  assert.equal(byFamily.get('platform-dev').median, 36);
  assert.equal(byFamily.get('platform-dev').sparse, false);
  // An assimilation is not a rename, so the CX row has a product but no median.
  assert.equal(byFamily.get('cx').products, 1);
  assert.equal(byFamily.get('cx').renames, 0);
  assert.equal(byFamily.get('cx').median, null);
  assert.equal(byFamily.get('cx').sparse, true);
  // An empty family still appears, rather than vanishing from the table.
  assert.equal(byFamily.get('hcm').products, 0);
});

test('time to SAP-ification is measured from the acquisition, not the first period', () => {
  const stats = assimilationStats(registry().products);

  assert.equal(stats.entries.length, 1);
  assert.equal(stats.entries[0].product.id, 'product-beta');
  assert.equal(stats.entries[0].months, 22);
  assert.equal(stats.median, 22);
});

test('a wave collects periods across products and takes their shared start', () => {
  const waves = waveStats(registry().wavesById);

  assert.equal(waves.length, 1);
  assert.equal(waves[0].id, 'big-2020');
  assert.equal(waves[0].products, 2);
  assert.equal(waves[0].start, '2020-01');
});

test('the index ranks the renamer above the product that has never been renamed', () => {
  const rows = riskIndex(registry().products, '2026-01-01');

  assert.equal(rows[0].product.id, 'product-alpha');
  assert.equal(rows[1].product.id, 'product-beta');
  assert.ok(rows.every(row => row.score >= 0 && row.score <= 100));
  // Never renamed, so it has no reference of its own and borrows the register's.
  assert.equal(rows[1].product.renameCount, 0);
  assert.equal(rows[1].churn, 0);
  assert.equal(rows[1].reference, 36);
});

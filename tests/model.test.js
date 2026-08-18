import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRegistry, matchesQuery, selectProducts } from '../src/model.js';

function data() {
  return {
    asOf: '2026-08-18',
    sources: [
      { id: 'src-a', title: 'A', publisher: 'X', url: 'https://example.org/a', type: 'first-party' },
      { id: 'src-b', title: 'B', publisher: 'X', url: 'https://example.org/b', type: 'archive' }
    ],
    products: [
      {
        id: 'product-alpha',
        emoji: '🧪',
        currentName: 'Alpha Two',
        family: 'platform-dev',
        origin: 'organic',
        periods: [
          { name: 'Alpha One', start: '2015-01', end: '2020-01', qualifier: 'launch', sources: ['src-a'] },
          { name: 'Alpha Two', start: '2020-01', qualifier: 'effective', transition: 'rename', sources: ['src-b'] }
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
          { name: 'Beta', start: '2018-03', end: '2020-03', qualifier: 'by', sources: ['src-a'] },
          { name: 'SAP Beta', start: '2020-03', qualifier: 'by', transition: 'assimilation', sources: ['src-a'] }
        ]
      }
    ]
  };
}

test('a running period is measured against asOf, not the current clock', () => {
  const registry = buildRegistry(data());
  const alpha = registry.products[0];
  assert.equal(alpha.currentPeriod.running, true);
  // January 2020 to August 2026 is 79 months, whatever day the page is opened.
  assert.equal(alpha.currentNameMonths, 79);
});

test('only renames are counted, assimilations are not', () => {
  const [alpha, beta] = buildRegistry(data()).products;
  assert.equal(alpha.renameCount, 1);
  assert.equal(beta.renameCount, 0, 'an assimilation is not a rename');
  assert.equal(beta.transitionCount, 1, 'but it is still a transition');
});

test('time to SAP-ification is only defined for acquired products', () => {
  const [alpha, beta] = buildRegistry(data()).products;
  assert.equal(alpha.monthsToAssimilation, null);
  assert.equal(beta.monthsToAssimilation, 24);
});

test('source ids are resolved to the source itself', () => {
  const alpha = buildRegistry(data()).products[0];
  assert.equal(alpha.periods[1].sources[0].title, 'B');
  assert.equal(alpha.periods[1].sources[0].type, 'archive');
});

test('the search finds names nobody uses any more', () => {
  const [alpha] = buildRegistry(data()).products;
  assert.equal(matchesQuery(alpha, 'Alpha One'), true, 'a retired name has to be findable');
  assert.equal(matchesQuery(alpha, 'alpha one'), true, 'case does not matter');
  assert.equal(matchesQuery(alpha, ''), true);
  assert.equal(matchesQuery(alpha, 'Gamma'), false);
});

test('filters narrow by family and by kind of transition', () => {
  const { products } = buildRegistry(data());
  assert.deepEqual(selectProducts(products, { families: ['cx'] }).map(p => p.id), ['product-beta']);
  assert.deepEqual(selectProducts(products, { transitions: ['rename'] }).map(p => p.id), ['product-alpha']);
  assert.equal(selectProducts(products, { families: [], transitions: [] }).length, 2);
});

test('sorting by renames puts the busiest product first', () => {
  const { products } = buildRegistry(data());
  assert.deepEqual(selectProducts(products, { sort: 'renames' }).map(p => p.id),
    ['product-alpha', 'product-beta']);
});

test('the empty dataset survives derivation', () => {
  const registry = buildRegistry({ asOf: '2026-08-18', sources: [], products: [] });
  assert.deepEqual(registry.products, []);
  assert.equal(registry.periodCount, 0);
});

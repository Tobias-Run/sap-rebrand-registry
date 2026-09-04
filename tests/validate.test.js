import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validate } from '../src/validate.js';

// Invented products rather than real SAP names: test fixtures must never be
// mistaken for the sourced dataset.
function dataset(overrides = {}) {
  return {
    asOf: '2026-08-18',
    sources: [
      { id: 'src-launch', title: 'Announcement', publisher: 'Example Press', url: 'https://example.org/a', type: 'first-party' },
      { id: 'src-rename', title: 'Rename', publisher: 'Example Press', url: 'https://example.org/b', type: 'first-party' }
    ],
    products: [
      {
        id: 'product-alpha',
        emoji: '🧪',
        currentName: 'Alpha Two',
        family: 'platform-dev',
        origin: 'organic',
        periods: [
          { name: 'Alpha One', start: '2015-03', end: '2020-01-01', qualifier: 'launch', sources: ['src-launch'] },
          { name: 'Alpha Two', start: '2020-01-01', qualifier: 'effective', transition: 'rename', lastConfirmed: '2026-01-01', sources: ['src-rename'] }
        ]
      }
    ],
    ...overrides
  };
}

function firstProduct(data) {
  return data.products[0];
}

function errorsOf(data) {
  return validate(data).errors.join('\n');
}

test('a clean dataset produces neither errors nor warnings', () => {
  const report = validate(dataset());
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.ok, true);
});

test('the empty starting dataset is valid', () => {
  const report = validate({ asOf: '2026-08-18', sources: [], products: [] });
  assert.deepEqual(report.errors, []);
});

test('asOf has to be day-precise', () => {
  assert.match(errorsOf(dataset({ asOf: '2026-08' })), /asOf.*day-precise/);
  assert.match(errorsOf(dataset({ asOf: undefined })), /asOf.*missing/);
});

test('exactly one running period per product', () => {
  const two = dataset();
  delete firstProduct(two).periods[0].end;
  assert.match(errorsOf(two), /2 running periods/);

  const none = dataset();
  firstProduct(none).periods[1].end = '2024-01-01';
  assert.match(errorsOf(none), /no running period/);
});

test('the running period has to be the last one', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.periods = [product.periods[1], { ...product.periods[0], transition: 'rename' }];
  product.currentName = 'Alpha One';
  assert.match(errorsOf(data), /running period must be the last one/);
});

test('periods have to meet without gaps', () => {
  const gap = dataset();
  firstProduct(gap).periods[0].end = '2019-06-01';
  assert.match(errorsOf(gap), /start of the following period/);

  const overlap = dataset();
  firstProduct(overlap).periods[1].start = '2019-01-01';
  assert.match(errorsOf(overlap), /start of the following period/);
});

test('an end has to fall after its start', () => {
  const data = dataset();
  firstProduct(data).periods[0].start = '2021-01-01';
  firstProduct(data).periods[0].end = '2020-01-01';
  assert.match(errorsOf(data), /does not fall after start/);
});

test('nothing may fall after asOf', () => {
  const data = dataset();
  firstProduct(data).periods[1].start = '2027-01-01';
  firstProduct(data).periods[0].end = '2027-01-01';
  assert.match(errorsOf(data), /falls after asOf/);
});

test('the first period has no transition, every later one needs a transition', () => {
  const first = dataset();
  firstProduct(first).periods[0].transition = 'rename';
  assert.match(errorsOf(first), /first period has no transition/);

  const second = dataset();
  delete firstProduct(second).periods[1].transition;
  assert.match(errorsOf(second), /transition.*unknown/);

  const nonsense = dataset();
  firstProduct(nonsense).periods[1].transition = 'renaming';
  assert.match(errorsOf(nonsense), /transition.*unknown/);
});

test('every period needs at least one source that resolves', () => {
  const without = dataset();
  firstProduct(without).periods[1].sources = [];
  assert.match(errorsOf(without), /at least one source/);

  const unknown = dataset();
  firstProduct(unknown).periods[1].sources = ['src-does-not-exist'];
  assert.match(errorsOf(unknown), /does not resolve/);
});

test('lower-ranked sources alone give a warning, not an error', () => {
  const data = dataset();
  data.sources[1].type = 'blog';
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /only lower-ranked sources/);
});

test('unused sources give a warning', () => {
  const data = dataset();
  data.sources.push({ id: 'src-loose', title: 'Unused', publisher: 'X', url: 'https://example.org/c', type: 'archive' });
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /referenced by no period/);
});

test('acquiredFrom and acquisitionDate depend on origin', () => {
  const organic = dataset();
  firstProduct(organic).acquiredFrom = 'Somebody Inc.';
  assert.match(errorsOf(organic), /acquiredFrom.*only allowed with origin/);

  const acquired = dataset();
  firstProduct(acquired).origin = 'acquired';
  const errors = errorsOf(acquired);
  assert.match(errors, /acquiredFrom.*missing or empty/);
  assert.match(errors, /acquisitionDate.*missing/);
});

test('an assimilation requires an acquisition', () => {
  const data = dataset();
  firstProduct(data).periods[1].transition = 'assimilation';
  assert.match(errorsOf(data), /'assimilation' requires origin: 'acquired'/);
});

test('the assimilation cannot precede the acquisition', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.origin = 'acquired';
  product.acquiredFrom = 'Alpha Systems Inc.';
  product.acquisitionDate = '2022-05-01';
  product.periods[1].transition = 'assimilation';
  assert.match(errorsOf(data), /acquisitionDate.*falls after the assimilation/);
});

test('currentName has to match the running period', () => {
  const data = dataset();
  firstProduct(data).currentName = 'Alpha Three';
  assert.match(errorsOf(data), /differs from the name of the running period/);
});

test('product ids are unique slugs', () => {
  const duplicate = dataset();
  duplicate.products.push({ ...firstProduct(duplicate) });
  assert.match(errorsOf(duplicate), /duplicate product id/);

  const messy = dataset();
  firstProduct(messy).id = 'Product Alpha';
  assert.match(errorsOf(messy), /not a valid slug/);
});

test('family, origin and qualifier are closed value lists', () => {
  const data = dataset();
  firstProduct(data).family = 'other';
  firstProduct(data).origin = 'inherited';
  firstProduct(data).periods[0].qualifier = 'probably';
  const errors = errorsOf(data);
  assert.match(errors, /family.*unknown/);
  assert.match(errors, /origin.*unknown/);
  assert.match(errors, /qualifier.*unknown/);
});

test('sources need an id, title, publisher, url and type', () => {
  const data = dataset();
  data.sources[0] = { id: 'src-launch', title: '', publisher: 'X', url: 'example.org', type: 'newspaper' };
  const errors = errorsOf(data);
  assert.match(errors, /title.*missing or empty/);
  assert.match(errors, /url.*http/);
  assert.match(errors, /type.*unknown/);
});

test('duplicate source ids are caught', () => {
  const data = dataset();
  data.sources.push({ ...data.sources[0] });
  assert.match(errorsOf(data), /duplicate source id/);
});

test('a missing emoji warns but does not block', () => {
  const data = dataset();
  delete firstProduct(data).emoji;
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /emoji.*no emoji/);
});

test('an emoji may not be letters, digits or words', () => {
  for (const value of ['SAP', 'x', '1', '']) {
    const data = dataset();
    firstProduct(data).emoji = value;
    assert.match(errorsOf(data), /emoji/, `${JSON.stringify(value)} should have been rejected`);
  }
  const tooLong = dataset();
  firstProduct(tooLong).emoji = '🧪🧪🧪';
  assert.match(errorsOf(tooLong), /emoji.*too long/);
});

test('composed emoji stay allowed', () => {
  // Variation selector and ZWJ sequence: several code points, one character.
  for (const value of ['🗄️', '🧑‍🏭', '✈️']) {
    const data = dataset();
    firstProduct(data).emoji = value;
    assert.deepEqual(validate(data).errors, [], `${value} should have passed`);
  }
});

test('garbage input does not crash the validator', () => {
  for (const junk of [null, [], 'text', 42]) {
    const report = validate(junk);
    assert.ok(report.errors.length > 0, `${JSON.stringify(junk)} should have produced errors`);
  }
  assert.ok(validate({ asOf: '2026-08-18', sources: 'no', products: 'also not' }).errors.length >= 2);
  assert.ok(validate({ asOf: '2026-08-18', sources: [], products: [{}] }).errors.length > 0);
});

test('a revert still counts as a rename, but only where a matching earlier name exists', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.periods[1].end = '2022-01-01';
  delete product.periods[1].lastConfirmed; // it is no longer the running period
  product.periods.push({
    name: 'Alpha One', start: '2022-01-01', qualifier: 'effective', transition: 'rename', revert: true, lastConfirmed: '2026-01-01', sources: ['src-rename']
  });
  product.currentName = 'Alpha One';
  assert.deepEqual(validate(data).errors, [], 'a revert to a name this product used before should validate');

  const noMatch = dataset();
  const productNoMatch = firstProduct(noMatch);
  productNoMatch.periods[1].revert = true;
  assert.match(errorsOf(noMatch), /revert.*no earlier period/,
    '"Alpha Two" was never used before, so revert cannot point at it');
});

test('revert only makes sense on a rename', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.origin = 'acquired';
  product.acquiredFrom = 'Alpha Systems Inc.';
  product.acquisitionDate = '2019-01-01';
  product.periods[1].transition = 'assimilation';
  product.periods[1].revert = true;
  assert.match(errorsOf(data), /revert.*only makes sense on transition: 'rename'/);
});

test('revert must be a boolean', () => {
  const data = dataset();
  firstProduct(data).periods[1].revert = 'yes';
  assert.match(errorsOf(data), /revert.*must be a boolean/);
});

test('a wave tag is a slug', () => {
  const data = dataset();
  firstProduct(data).periods[1].wave = 'Not A Slug';
  assert.match(errorsOf(data), /wave.*not a valid slug/);

  const valid = dataset();
  firstProduct(valid).periods[1].wave = 'alpha-2020';
  assert.deepEqual(validate(valid).errors, []);
});

test('periods sharing a wave should share a start date - warning, not an error', () => {
  const data = dataset({
    products: [
      dataset().products[0],
      {
        id: 'product-beta',
        emoji: '🧭',
        currentName: 'Beta Two',
        family: 'cx',
        origin: 'organic',
        periods: [
          { name: 'Beta One', start: '2016', end: '2020-06-01', qualifier: 'launch', sources: ['src-launch'] },
          { name: 'Beta Two', start: '2020-06-01', qualifier: 'effective', transition: 'rename', wave: 'joint-2020', lastConfirmed: '2026-01-01', sources: ['src-rename'] }
        ]
      }
    ]
  });
  data.products[0].periods[1].wave = 'joint-2020';
  const report = validate(data);
  assert.deepEqual(report.errors, [], 'a mismatched wave date is a warning, not an error');
  assert.match(report.warnings.join('\n'), /wave\.joint-2020.*do not share a start date/);

  const matching = dataset({
    products: [
      dataset().products[0],
      {
        id: 'product-beta',
        emoji: '🧭',
        currentName: 'Beta Two',
        family: 'cx',
        origin: 'organic',
        periods: [
          { name: 'Beta One', start: '2016', end: '2020-01-01', qualifier: 'launch', sources: ['src-launch'] },
          { name: 'Beta Two', start: '2020-01-01', qualifier: 'effective', transition: 'rename', wave: 'joint-2020', lastConfirmed: '2026-01-01', sources: ['src-rename'] }
        ]
      }
    ]
  });
  matching.products[0].periods[1].wave = 'joint-2020';
  assert.deepEqual(validate(matching).warnings, [], 'matching start dates raise no warning');
});

test('succeeds has to resolve, and cannot point at itself', () => {
  const withSuccessor = dataset({
    products: [
      dataset().products[0],
      { ...dataset().products[0], id: 'product-gamma', currentName: 'Gamma', succeeds: 'product-alpha',
        periods: [{ name: 'Gamma', start: '2021-01-01', qualifier: 'launch', lastConfirmed: '2026-01-01', sources: ['src-launch'] }] }
    ]
  });
  assert.deepEqual(validate(withSuccessor).errors, []);

  const selfRef = dataset();
  firstProduct(selfRef).succeeds = 'product-alpha';
  assert.match(errorsOf(selfRef), /succeeds.*cannot succeed itself/);

  const dangling = dataset();
  firstProduct(dangling).succeeds = 'product-does-not-exist';
  assert.match(errorsOf(dangling), /succeeds.*does not resolve/);
});

test('succeeds cannot form a cycle', () => {
  const data = dataset({
    products: [
      { ...dataset().products[0], id: 'product-a', succeeds: 'product-b' },
      { ...dataset().products[0], id: 'product-b', succeeds: 'product-a' }
    ]
  });
  assert.match(errorsOf(data), /succeeds forms a cycle/);
});

/* ---------- lastConfirmed ---------- */

test('a running period without lastConfirmed warns but does not fail', () => {
  const data = dataset();
  delete firstProduct(data).periods[1].lastConfirmed;
  const result = validate(data);

  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join('\n'), /lastConfirmed: a running period should record/);
});

test('lastConfirmed does not belong on a period that has ended', () => {
  const data = dataset();
  firstProduct(data).periods[0].lastConfirmed = '2019-01-01';

  assert.match(errorsOf(data), /lastConfirmed: only belongs on the running period/);
});

test('lastConfirmed cannot predate its own period or outrun asOf', () => {
  const early = dataset();
  firstProduct(early).periods[1].lastConfirmed = '2019-06-01';
  assert.match(errorsOf(early), /lastConfirmed: falls before the period starts/);

  const late = dataset();
  firstProduct(late).periods[1].lastConfirmed = '2027-01-01';
  assert.match(errorsOf(late), /lastConfirmed: falls after asOf/);
});

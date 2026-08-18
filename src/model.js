// Everything the pages display is derived here, from products.json and
// nothing else. No number is maintained by hand, and none is stored twice.

import { COUNTED_TRANSITIONS, FAMILY_LABELS } from './constants.js';
import { compareDates, monthsBetween } from './dates.js';

// A running period is measured against asOf, not against the visitor's clock.
// Otherwise no figure on the page would be reproducible.
function periodLength(period, asOf) {
  return monthsBetween(period.start, period.end ?? asOf);
}

function decoratePeriod(period, sourcesById, asOf) {
  return {
    ...period,
    running: period.end === undefined,
    months: periodLength(period, asOf),
    sources: period.sources
      .map(id => sourcesById.get(id))
      .filter(Boolean)
  };
}

function decorateProduct(product, sourcesById, asOf) {
  const periods = product.periods.map(period => decoratePeriod(period, sourcesById, asOf));
  const current = periods[periods.length - 1];

  const counted = periods.filter(period => COUNTED_TRANSITIONS.includes(period.transition));
  const transitions = periods.filter(period => period.transition !== undefined);

  return {
    ...product,
    periods,
    familyLabel: FAMILY_LABELS[product.family] ?? product.family,
    currentPeriod: current,
    currentNameMonths: current.months,
    renameCount: counted.length,
    transitionCount: transitions.length,
    // Time to SAP-ification: the gap between the acquisition and the first
    // assimilation. Only defined where both are known.
    monthsToAssimilation: monthsToAssimilation(product)
  };
}

function monthsToAssimilation(product) {
  if (product.origin !== 'acquired') return null;
  const assimilation = product.periods.find(period => period.transition === 'assimilation');
  if (!assimilation || !product.acquisitionDate) return null;
  return monthsBetween(product.acquisitionDate, assimilation.start);
}

export function buildRegistry(data) {
  const sourcesById = new Map((data.sources ?? []).map(source => [source.id, source]));
  const products = (data.products ?? [])
    .map(product => decorateProduct(product, sourcesById, data.asOf));

  return {
    asOf: data.asOf,
    sourcesById,
    products,
    periodCount: products.reduce((sum, product) => sum + product.periods.length, 0),
    sourceCount: sourcesById.size
  };
}

// Matches against every name a product ever carried, not just the current one.
// Looking up a name nobody uses any more is the whole point of the register.
export function matchesQuery(product, query) {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  return product.periods.some(period => period.name.toLowerCase().includes(needle))
    || product.id.includes(needle)
    || product.familyLabel.toLowerCase().includes(needle);
}

export const SORTS = {
  'name': {
    label: 'Current name',
    compare: (a, b) => a.currentName.localeCompare(b.currentName)
  },
  'renames': {
    label: 'Renames',
    compare: (a, b) => b.renameCount - a.renameCount || a.currentName.localeCompare(b.currentName)
  },
  'current-age': {
    label: 'Age of current name',
    compare: (a, b) => b.currentNameMonths - a.currentNameMonths
  },
  'first-record': {
    label: 'Earliest record',
    compare: (a, b) => compareDates(a.periods[0].start, b.periods[0].start)
  }
};

export function selectProducts(products, { query = '', families = [], transitions = [], sort = 'name' } = {}) {
  const compare = (SORTS[sort] ?? SORTS.name).compare;
  return products
    .filter(product => matchesQuery(product, query))
    .filter(product => families.length === 0 || families.includes(product.family))
    .filter(product => transitions.length === 0
      || product.periods.some(period => transitions.includes(period.transition)))
    .sort(compare);
}

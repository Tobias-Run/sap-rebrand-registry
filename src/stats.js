// Everything the analysis page counts. Pure functions over the registry that
// model.js builds, so each figure can be tested without a browser and none of
// them is written down anywhere by hand.
//
// One rule runs through all of it: only a `rename` feeds a statistic. An
// assimilation is the predictable consequence of an acquisition and gets its
// own metric; a generation change is not a rebrand at all. Mixing the three
// would make bought-in families look restless and inflate every median.

import { FAMILIES, FAMILY_LABELS, SPARSE_FAMILY_THRESHOLD, STALE_CONFIRMATION_MONTHS } from './constants.js';
import { monthsBetween } from './dates.js';

export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

// What ended a name period is recorded on the *next* period, because that is
// where the transition into the new name lives. A period with nothing after it
// has not ended at all - it is censored, not short.
export function nameLifetimes(products) {
  const lifetimes = [];
  for (const product of products) {
    product.periods.forEach((period, index) => {
      const next = product.periods[index + 1];
      lifetimes.push({
        product,
        period,
        months: period.months,
        endedBy: next ? next.transition : 'running'
      });
    });
  }
  return lifetimes;
}

// The headline question: how long does an SAP product name last before it is
// replaced by another name for the same product?
export function lifetimeStats(products) {
  const all = nameLifetimes(products);
  const renamed = all.filter(entry => entry.endedBy === 'rename');
  const months = renamed.map(entry => entry.months);
  const running = all.filter(entry => entry.endedBy === 'running');

  return {
    all,
    renamed,
    running,
    median: median(months),
    shortest: renamed.length ? renamed.reduce((a, b) => (a.months <= b.months ? a : b)) : null,
    longest: renamed.length ? renamed.reduce((a, b) => (a.months >= b.months ? a : b)) : null,
    // Names still in force. They are the reason the median is a lower bound:
    // a name that has not been replaced yet can only turn out longer.
    censored: running.length,
    medianRunning: median(running.map(entry => entry.months))
  };
}

export function familyStats(products) {
  const lifetimes = nameLifetimes(products);

  return FAMILIES.map(family => {
    const members = products.filter(product => product.family === family);
    const renames = members.reduce((sum, product) => sum + product.renameCount, 0);
    const months = lifetimes
      .filter(entry => entry.endedBy === 'rename' && entry.product.family === family)
      .map(entry => entry.months);

    return {
      family,
      label: FAMILY_LABELS[family] ?? family,
      products: members.length,
      renames,
      median: median(months),
      // Flagged, never merged into a neighbour: a family with two renames
      // behind it has a median, but not one worth reading.
      sparse: renames < SPARSE_FAMILY_THRESHOLD
    };
  });
}

// Time to SAP-ification: acquisition to the first period carrying the SAP
// name. The one metric where an assimilation is the point rather than noise.
export function assimilationStats(products) {
  const entries = products
    .filter(product => product.monthsToAssimilation !== null)
    .map(product => ({ product, months: product.monthsToAssimilation }))
    .sort((a, b) => a.months - b.months);

  return { entries, median: median(entries.map(entry => entry.months)) };
}

export function waveStats(wavesById) {
  return [...wavesById.entries()]
    .map(([id, members]) => ({
      id,
      members,
      // The earliest start among the members, not the first one encountered:
      // a rollout spread over a few days is still one wave, and the wave began
      // when its first product changed.
      start: members.map(member => member.period.start).sort()[0],
      products: members.length
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

const clamp = value => Math.max(0, Math.min(1, value));

// One rename every four years is about as restless as anything in the dataset
// gets, so that is where the churn component tops out.
const CHURN_CEILING = 0.25;

// How the index is built, in full, because a number nobody can reconstruct is
// worth nothing:
//
//   churn   renames per year across the product's tracked history, capped
//   overdue how far the current name has run against the length this product's
//           names usually reach - its own median, or the register's where the
//           product has never been renamed. Saturating rather than capped:
//           almost every current name in the register has already outrun its
//           own reference, so a hard cap at 1 would flatten the component into
//           a constant and tie unrelated products at the same score.
//
// Weighted 60/40 toward churn: a product that has changed name three times is
// telling you more about itself than one whose current name happens to be old.
// It measures what has already happened. It is not a forecast, and SAP's plans
// are not an input, because we do not have them.
export function riskIndex(products, asOf) {
  const lifetimes = nameLifetimes(products);
  const fallback = median(
    lifetimes.filter(entry => entry.endedBy === 'rename').map(entry => entry.months)
  );

  return products
    .map(product => {
      const trackedMonths = monthsBetween(product.periods[0].start, asOf);
      const perYear = trackedMonths > 0 ? product.renameCount / (trackedMonths / 12) : 0;
      const churn = clamp(perYear / CHURN_CEILING);

      const own = median(
        lifetimes
          .filter(entry => entry.endedBy === 'rename' && entry.product === product)
          .map(entry => entry.months)
      );
      const reference = own ?? fallback;
      const overdue = reference ? 1 - Math.exp(-product.currentNameMonths / reference) : 0;

      return {
        product,
        trackedMonths,
        perYear,
        churn,
        reference,
        overdue,
        score: Math.round(100 * (0.6 * churn + 0.4 * overdue))
      };
    })
    .sort((a, b) => b.score - a.score || a.product.currentName.localeCompare(b.product.currentName));
}

// Every running period asserts that its name is current. That assertion is
// only as strong as the newest source showing the name, and for some products
// the evidence stops years back. This counts the gap rather than leaving each
// entry to imply today.
export function confirmationStats(products) {
  const running = products
    .map(product => ({
      product,
      lastConfirmed: product.currentPeriod.lastConfirmed ?? null,
      monthsSince: product.currentPeriod.monthsSinceConfirmed
    }))
    .filter(entry => entry.lastConfirmed !== null)
    .sort((a, b) => b.monthsSince - a.monthsSince);

  return {
    entries: running,
    stale: running.filter(entry => entry.monthsSince >= STALE_CONFIRMATION_MONTHS),
    median: median(running.map(entry => entry.monthsSince)),
    threshold: STALE_CONFIRMATION_MONTHS
  };
}

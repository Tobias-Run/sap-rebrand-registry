import {
  FAMILIES, ORIGINS, QUALIFIERS, SOURCE_TYPES, TRANSITIONS, WEAK_SOURCE_TYPES
} from './constants.js';
import { compareDates, isValidDate } from './dates.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Findings carry a path so a message can be located in the JSON without
// searching for it.
class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  error(path, message) { this.errors.push(`${path}: ${message}`); }
  warn(path, message) { this.warnings.push(`${path}: ${message}`); }
  get ok() { return this.errors.length === 0; }
}

function checkDate(report, path, value, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) report.error(path, 'date is missing');
    return false;
  }
  if (!isValidDate(value)) {
    report.error(path, `not a valid date: ${JSON.stringify(value)}. Expected YYYY, YYYY-MM or YYYY-MM-DD`);
    return false;
  }
  return true;
}

function checkText(report, path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    report.error(path, 'is missing or empty');
    return false;
  }
  return true;
}

// The emoji stands in for a logo on the register page. We show no SAP marks as
// graphics, but a long chain of names needs something to anchor the row.
// Optional, so an entry never fails over decoration - if it is absent, the
// validator warns.
function checkEmoji(report, path, value) {
  if (value === undefined) {
    report.warn(path, 'no emoji set');
    return;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    report.error(path, 'is missing or empty');
    return;
  }
  if (/[A-Za-z0-9]/.test(value)) {
    report.error(path, `must not contain letters or digits: ${JSON.stringify(value)}`);
    return;
  }
  // What counts is what you see, not what is stored: a variation selector or a
  // ZWJ sequence such as the mechanic emoji is one character even though it
  // occupies several code points. Two characters is the limit - a row marker,
  // not a picture story.
  const graphemes = countGraphemes(value);
  if (graphemes > 2) {
    report.error(path, `too long: ${graphemes} characters, at most 2 are allowed`);
  }
}

function countGraphemes(value) {
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].length;
  }
  return [...value].length;
}

function validateSources(report, sources) {
  const byId = new Map();
  if (!Array.isArray(sources)) {
    report.error('sources', 'must be an array');
    return byId;
  }
  sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (!checkText(report, `${path}.id`, source?.id)) return;
    if (byId.has(source.id)) report.error(`${path}.id`, `duplicate source id: ${source.id}`);
    byId.set(source.id, source);

    checkText(report, `${path}.title`, source.title);
    checkText(report, `${path}.publisher`, source.publisher);
    if (checkText(report, `${path}.url`, source.url) && !/^https?:\/\//.test(source.url)) {
      report.error(`${path}.url`, 'must start with http:// or https://');
    }
    if (!SOURCE_TYPES.includes(source.type)) {
      report.error(`${path}.type`, `unknown: ${JSON.stringify(source.type)}. Allowed: ${SOURCE_TYPES.join(', ')}`);
    }
    if (source.published !== undefined) checkDate(report, `${path}.published`, source.published);
    if (source.retrieved !== undefined) checkDate(report, `${path}.retrieved`, source.retrieved);
  });
  return byId;
}

function validatePeriods(report, product, path, sourcesById, asOf) {
  const periods = product.periods;
  if (!Array.isArray(periods) || periods.length === 0) {
    report.error(`${path}.periods`, 'must hold at least one period');
    return;
  }

  periods.forEach((period, index) => {
    const at = `${path}.periods[${index}]`;
    checkText(report, `${at}.name`, period?.name);
    checkDate(report, `${at}.start`, period?.start);
    if (period?.end !== undefined) checkDate(report, `${at}.end`, period.end);

    if (!QUALIFIERS.includes(period?.qualifier)) {
      report.error(`${at}.qualifier`, `unknown: ${JSON.stringify(period?.qualifier)}. Allowed: ${QUALIFIERS.join(', ')}`);
    }

    // The first period is the starting state. There is no transition into it.
    if (index === 0) {
      if (period?.transition !== undefined) {
        report.error(`${at}.transition`, 'the first period has no transition, the field must be absent');
      }
    } else if (!TRANSITIONS.includes(period?.transition)) {
      report.error(`${at}.transition`, `unknown: ${JSON.stringify(period?.transition)}. Allowed: ${TRANSITIONS.join(', ')}`);
    }

    if (period?.transition === 'assimilation' && product.origin !== 'acquired') {
      report.error(`${at}.transition`, "'assimilation' requires origin: 'acquired'");
    }

    // A revert counts as a rename like any other - it still moved the name,
    // even if the destination is one we have seen before. The flag exists so
    // it can be told apart from a genuinely new name, not to exempt it from
    // the statistics.
    if (period?.revert !== undefined) {
      if (typeof period.revert !== 'boolean') {
        report.error(`${at}.revert`, `must be a boolean, is ${JSON.stringify(period.revert)}`);
      } else if (period.revert) {
        if (period?.transition !== 'rename') {
          report.error(`${at}.revert`, "only makes sense on transition: 'rename'");
        }
        if (typeof period?.name === 'string'
          && !periods.slice(0, index).some(earlier => earlier?.name === period.name)) {
          report.error(`${at}.revert`, `no earlier period of this product is named ${JSON.stringify(period.name)}`);
        }
      }
    }

    // A wave groups periods that changed on the same day for the same
    // announced reason, across different products - free-form because SAP
    // does not name these events itself, we do, after the fact.
    if (period?.wave !== undefined && !SLUG.test(period.wave ?? '')) {
      report.error(`${at}.wave`, `not a valid slug: ${JSON.stringify(period?.wave)}. Expected lowercase letters, digits and hyphens`);
    }

    if (!Array.isArray(period?.sources) || period.sources.length === 0) {
      report.error(`${at}.sources`, 'every period needs at least one source');
    } else {
      period.sources.forEach((id, position) => {
        if (!sourcesById.has(id)) {
          report.error(`${at}.sources[${position}]`, `source id does not resolve: ${JSON.stringify(id)}`);
        }
      });
      const types = period.sources.map(id => sourcesById.get(id)?.type).filter(Boolean);
      if (types.length > 0 && types.every(type => WEAK_SOURCE_TYPES.includes(type))) {
        report.warn(`${at}.sources`, 'only lower-ranked sources (analyst or blog), no primary source');
      }
    }

    if (isValidDate(period?.start) && isValidDate(period?.end)
      && compareDates(period.start, period.end) >= 0) {
      report.error(at, `end ${period.end} does not fall after start ${period.start}`);
    }
    if (isValidDate(period?.end) && isValidDate(asOf) && compareDates(period.end, asOf) > 0) {
      report.error(`${at}.end`, `falls after asOf (${asOf})`);
    }
    if (isValidDate(period?.start) && isValidDate(asOf) && compareDates(period.start, asOf) > 0) {
      report.error(`${at}.start`, `falls after asOf (${asOf})`);
    }
  });

  // Exactly one running period, and it has to be the last one.
  const openIndexes = periods
    .map((period, index) => (period?.end === undefined ? index : -1))
    .filter(index => index >= 0);
  if (openIndexes.length === 0) {
    report.error(`${path}.periods`, 'no running period: exactly one period must have no end');
  } else if (openIndexes.length > 1) {
    report.error(`${path}.periods`, `${openIndexes.length} running periods (indexes ${openIndexes.join(', ')}), exactly one is allowed`);
  } else if (openIndexes[0] !== periods.length - 1) {
    report.error(`${path}.periods[${openIndexes[0]}]`, 'the running period must be the last one');
  }

  // No gaps, no overlaps: one period's end is the next one's start, character
  // for character and in the same precision.
  for (let index = 0; index < periods.length - 1; index += 1) {
    const current = periods[index];
    const next = periods[index + 1];
    if (current?.end === undefined || next?.start === undefined) continue;
    if (current.end !== next.start) {
      report.error(`${path}.periods[${index}].end`,
        `must match the start of the following period: ${current.end} against ${next.start}`);
    }
  }

  const last = periods[periods.length - 1];
  if (typeof product.currentName === 'string' && typeof last?.name === 'string'
    && product.currentName !== last.name) {
    report.error(`${path}.currentName`,
      `differs from the name of the running period: ${JSON.stringify(product.currentName)} against ${JSON.stringify(last.name)}`);
  }

  // Time to SAP-ification cannot be negative.
  const assimilation = periods.find(period => period?.transition === 'assimilation');
  if (assimilation && isValidDate(product.acquisitionDate) && isValidDate(assimilation.start)
    && compareDates(product.acquisitionDate, assimilation.start) > 0) {
    report.error(`${path}.acquisitionDate`,
      `falls after the assimilation (${assimilation.start})`);
  }
}

function validateWaves(report, products) {
  const waves = new Map(); // wave id -> [{ start, path }]
  products.forEach((product, productIndex) => {
    (product?.periods ?? []).forEach((period, periodIndex) => {
      if (typeof period?.wave !== 'string') return;
      const at = `products[${productIndex}].periods[${periodIndex}]`;
      if (!waves.has(period.wave)) waves.set(period.wave, []);
      waves.get(period.wave).push({ start: period.start, path: at });
    });
  });
  for (const [wave, entries] of waves) {
    const starts = new Set(entries.map(entry => entry.start));
    if (starts.size > 1) {
      report.warn(`wave.${wave}`,
        `periods tagged with this wave do not share a start date: ${[...starts].join(', ')}`);
    }
  }
}

// succeeds is informational only: it names a predecessor a product ran
// alongside rather than replaced, so the connection is visible without
// pretending the two share one chain of periods (see SCHEMA.md).
function validateSucceeds(report, products) {
  const ids = new Set(products.map(product => product?.id).filter(id => typeof id === 'string'));
  products.forEach((product, index) => {
    if (product?.succeeds === undefined) return;
    const path = `products[${index}].succeeds`;
    if (typeof product.succeeds !== 'string') {
      report.error(path, `must be a product id, is ${JSON.stringify(product.succeeds)}`);
      return;
    }
    if (product.succeeds === product.id) {
      report.error(path, 'a product cannot succeed itself');
      return;
    }
    if (!ids.has(product.succeeds)) {
      report.error(path, `product id does not resolve: ${JSON.stringify(product.succeeds)}`);
      return;
    }
    // A cycle (A succeeds B succeeds A) would make "predecessor" meaningless.
    // Products are few enough that walking the chain is cheap.
    const byId = new Map(products.map(entry => [entry?.id, entry]));
    const seen = new Set([product.id]);
    let current = byId.get(product.succeeds);
    while (current?.succeeds !== undefined) {
      if (seen.has(current.succeeds)) {
        report.error(path, `succeeds forms a cycle: ${[...seen, current.succeeds].join(' -> ')}`);
        return;
      }
      seen.add(current.id);
      current = byId.get(current.succeeds);
    }
  });
}

function validateProducts(report, products, sourcesById, asOf) {
  const usedSources = new Set();
  if (!Array.isArray(products)) {
    report.error('products', 'must be an array');
    return usedSources;
  }
  validateWaves(report, products);
  validateSucceeds(report, products);
  const ids = new Set();
  products.forEach((product, index) => {
    const path = `products[${index}]`;
    if (checkText(report, `${path}.id`, product?.id)) {
      if (!SLUG.test(product.id)) {
        report.error(`${path}.id`, `not a valid slug: ${JSON.stringify(product.id)}. Expected lowercase letters, digits and hyphens`);
      }
      if (ids.has(product.id)) report.error(`${path}.id`, `duplicate product id: ${product.id}`);
      ids.add(product.id);
    }
    checkText(report, `${path}.currentName`, product?.currentName);
    checkEmoji(report, `${path}.emoji`, product?.emoji);

    if (!FAMILIES.includes(product?.family)) {
      report.error(`${path}.family`, `unknown: ${JSON.stringify(product?.family)}. Allowed: ${FAMILIES.join(', ')}`);
    }
    if (!ORIGINS.includes(product?.origin)) {
      report.error(`${path}.origin`, `unknown: ${JSON.stringify(product?.origin)}. Allowed: ${ORIGINS.join(', ')}`);
    }

    if (product?.origin === 'acquired') {
      checkText(report, `${path}.acquiredFrom`, product.acquiredFrom);
      checkDate(report, `${path}.acquisitionDate`, product.acquisitionDate);
    } else {
      if (product?.acquiredFrom !== undefined) {
        report.error(`${path}.acquiredFrom`, "only allowed with origin: 'acquired'");
      }
      if (product?.acquisitionDate !== undefined) {
        report.error(`${path}.acquisitionDate`, "only allowed with origin: 'acquired'");
      }
    }

    validatePeriods(report, product ?? {}, path, sourcesById, asOf);

    (product?.periods ?? []).forEach(period => {
      (period?.sources ?? []).forEach(id => usedSources.add(id));
    });
  });
  return usedSources;
}

export function validate(data) {
  const report = new Report();

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    report.error('/', 'the file must contain an object');
    return report;
  }

  // asOf makes running periods reproducible. Without day precision the field
  // would be worthless.
  if (checkDate(report, 'asOf', data.asOf) && data.asOf.length !== 10) {
    report.error('asOf', `must be day-precise (YYYY-MM-DD), but is ${data.asOf}`);
  }

  const sourcesById = validateSources(report, data.sources);
  const usedSources = validateProducts(report, data.products, sourcesById, data.asOf);

  for (const id of sourcesById.keys()) {
    if (!usedSources.has(id)) report.warn(`sources.${id}`, 'is referenced by no period');
  }

  return report;
}

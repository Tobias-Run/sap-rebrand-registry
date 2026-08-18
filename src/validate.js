import {
  FAMILIES, ORIGINS, QUALIFIERS, SOURCE_TYPES, TRANSITIONS, WEAK_SOURCE_TYPES
} from './constants.js';
import { compareDates, isValidDate } from './dates.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Sammelt Befunde mit Pfadangabe, damit eine Meldung ohne Suchen im JSON
// auffindbar ist.
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
    if (required) report.error(path, 'Datum fehlt');
    return false;
  }
  if (!isValidDate(value)) {
    report.error(path, `kein gueltiges Datum: ${JSON.stringify(value)}. Erwartet YYYY, YYYY-MM oder YYYY-MM-DD`);
    return false;
  }
  return true;
}

function checkText(report, path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    report.error(path, 'fehlt oder ist leer');
    return false;
  }
  return true;
}

// Ein Emoji steht auf der Registerseite anstelle eines Logos: Wir zeigen
// keine SAP-Marken als Grafik, brauchen aber eine Zeilenmarke, die eine lange
// Namenskette optisch traegt. Optional, damit ein Eintrag nicht an der
// Bebilderung scheitert - fehlt es, gibt es eine Warnung.
function checkEmoji(report, path, value) {
  if (value === undefined) {
    report.warn(path, 'kein Emoji gesetzt');
    return;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    report.error(path, 'fehlt oder ist leer');
    return;
  }
  if (/[A-Za-z0-9]/.test(value)) {
    report.error(path, `darf keine Buchstaben oder Ziffern enthalten: ${JSON.stringify(value)}`);
    return;
  }
  // Gezaehlt wird, was man sieht, nicht was gespeichert ist: Ein Variations-
  // selektor oder eine ZWJ-Folge wie 🧑‍🏭 ist ein Zeichen, auch wenn mehrere
  // Codepunkte darin stecken. Zwei Zeichen sind die Grenze - eine Zeilenmarke,
  // keine Bildergeschichte.
  const graphemes = countGraphemes(value);
  if (graphemes > 2) {
    report.error(path, `zu lang: ${graphemes} Zeichen, erlaubt sind hoechstens 2`);
  }
}

function countGraphemes(value) {
  if (typeof Intl?.Segmenter === 'function') {
    return [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(value)].length;
  }
  return [...value].length;
}

function validateSources(report, sources) {
  const byId = new Map();
  if (!Array.isArray(sources)) {
    report.error('sources', 'muss ein Array sein');
    return byId;
  }
  sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (!checkText(report, `${path}.id`, source?.id)) return;
    if (byId.has(source.id)) report.error(`${path}.id`, `doppelte Quellen-ID: ${source.id}`);
    byId.set(source.id, source);

    checkText(report, `${path}.title`, source.title);
    checkText(report, `${path}.publisher`, source.publisher);
    if (checkText(report, `${path}.url`, source.url) && !/^https?:\/\//.test(source.url)) {
      report.error(`${path}.url`, 'muss mit http:// oder https:// beginnen');
    }
    if (!SOURCE_TYPES.includes(source.type)) {
      report.error(`${path}.type`, `unbekannt: ${JSON.stringify(source.type)}. Erlaubt: ${SOURCE_TYPES.join(', ')}`);
    }
    if (source.published !== undefined) checkDate(report, `${path}.published`, source.published);
    if (source.retrieved !== undefined) checkDate(report, `${path}.retrieved`, source.retrieved);
  });
  return byId;
}

function validatePeriods(report, product, path, sourcesById, asOf) {
  const periods = product.periods;
  if (!Array.isArray(periods) || periods.length === 0) {
    report.error(`${path}.periods`, 'muss mindestens eine Periode enthalten');
    return;
  }

  periods.forEach((period, index) => {
    const at = `${path}.periods[${index}]`;
    checkText(report, `${at}.name`, period?.name);
    checkDate(report, `${at}.start`, period?.start);
    if (period?.end !== undefined) checkDate(report, `${at}.end`, period.end);

    if (!QUALIFIERS.includes(period?.qualifier)) {
      report.error(`${at}.qualifier`, `unbekannt: ${JSON.stringify(period?.qualifier)}. Erlaubt: ${QUALIFIERS.join(', ')}`);
    }

    // Die erste Periode ist der Ausgangszustand, es gibt keinen Uebergang
    // in sie hinein.
    if (index === 0) {
      if (period?.transition !== undefined) {
        report.error(`${at}.transition`, 'die erste Periode hat keinen Uebergang, das Feld muss fehlen');
      }
    } else if (!TRANSITIONS.includes(period?.transition)) {
      report.error(`${at}.transition`, `unbekannt: ${JSON.stringify(period?.transition)}. Erlaubt: ${TRANSITIONS.join(', ')}`);
    }

    if (period?.transition === 'assimilation' && product.origin !== 'acquired') {
      report.error(`${at}.transition`, "'assimilation' setzt origin: 'acquired' voraus");
    }

    if (!Array.isArray(period?.sources) || period.sources.length === 0) {
      report.error(`${at}.sources`, 'jede Periode braucht mindestens eine Quelle');
    } else {
      period.sources.forEach((id, position) => {
        if (!sourcesById.has(id)) {
          report.error(`${at}.sources[${position}]`, `Quellen-ID nicht auflösbar: ${JSON.stringify(id)}`);
        }
      });
      const types = period.sources.map(id => sourcesById.get(id)?.type).filter(Boolean);
      if (types.length > 0 && types.every(type => WEAK_SOURCE_TYPES.includes(type))) {
        report.warn(`${at}.sources`, 'nur nachrangige Quellen (Analyst oder Blog), Erstquelle fehlt');
      }
    }

    if (isValidDate(period?.start) && isValidDate(period?.end)
      && compareDates(period.start, period.end) >= 0) {
      report.error(at, `Ende ${period.end} liegt nicht nach Beginn ${period.start}`);
    }
    if (isValidDate(period?.end) && isValidDate(asOf) && compareDates(period.end, asOf) > 0) {
      report.error(`${at}.end`, `liegt nach asOf (${asOf})`);
    }
    if (isValidDate(period?.start) && isValidDate(asOf) && compareDates(period.start, asOf) > 0) {
      report.error(`${at}.start`, `liegt nach asOf (${asOf})`);
    }
  });

  // Genau eine laufende Periode, und zwar die letzte.
  const openIndexes = periods
    .map((period, index) => (period?.end === undefined ? index : -1))
    .filter(index => index >= 0);
  if (openIndexes.length === 0) {
    report.error(`${path}.periods`, 'keine laufende Periode: genau eine Periode muss ohne end auskommen');
  } else if (openIndexes.length > 1) {
    report.error(`${path}.periods`, `${openIndexes.length} laufende Perioden (Indizes ${openIndexes.join(', ')}), erlaubt ist genau eine`);
  } else if (openIndexes[0] !== periods.length - 1) {
    report.error(`${path}.periods[${openIndexes[0]}]`, 'die laufende Periode muss die letzte sein');
  }

  // Lueckenlos und ueberschneidungsfrei: Das Ende einer Periode ist zugleich
  // der Beginn der naechsten, exakt und in derselben Praezision.
  for (let index = 0; index < periods.length - 1; index += 1) {
    const current = periods[index];
    const next = periods[index + 1];
    if (current?.end === undefined || next?.start === undefined) continue;
    if (current.end !== next.start) {
      report.error(`${path}.periods[${index}].end`,
        `muss dem Beginn der Folgeperiode entsprechen: ${current.end} gegen ${next.start}`);
    }
  }

  const last = periods[periods.length - 1];
  if (typeof product.currentName === 'string' && typeof last?.name === 'string'
    && product.currentName !== last.name) {
    report.error(`${path}.currentName`,
      `weicht vom Namen der laufenden Periode ab: ${JSON.stringify(product.currentName)} gegen ${JSON.stringify(last.name)}`);
  }

  // Die Zeit bis zur SAP-Werdung kann nicht negativ sein.
  const assimilation = periods.find(period => period?.transition === 'assimilation');
  if (assimilation && isValidDate(product.acquisitionDate) && isValidDate(assimilation.start)
    && compareDates(product.acquisitionDate, assimilation.start) > 0) {
    report.error(`${path}.acquisitionDate`,
      `liegt nach der Eingliederung (${assimilation.start})`);
  }
}

function validateProducts(report, products, sourcesById, asOf) {
  const usedSources = new Set();
  if (!Array.isArray(products)) {
    report.error('products', 'muss ein Array sein');
    return usedSources;
  }
  const ids = new Set();
  products.forEach((product, index) => {
    const path = `products[${index}]`;
    if (checkText(report, `${path}.id`, product?.id)) {
      if (!SLUG.test(product.id)) {
        report.error(`${path}.id`, `kein gueltiger Slug: ${JSON.stringify(product.id)}. Erwartet Kleinbuchstaben, Ziffern und Bindestriche`);
      }
      if (ids.has(product.id)) report.error(`${path}.id`, `doppelte Produkt-ID: ${product.id}`);
      ids.add(product.id);
    }
    checkText(report, `${path}.currentName`, product?.currentName);
    checkEmoji(report, `${path}.emoji`, product?.emoji);

    if (!FAMILIES.includes(product?.family)) {
      report.error(`${path}.family`, `unbekannt: ${JSON.stringify(product?.family)}. Erlaubt: ${FAMILIES.join(', ')}`);
    }
    if (!ORIGINS.includes(product?.origin)) {
      report.error(`${path}.origin`, `unbekannt: ${JSON.stringify(product?.origin)}. Erlaubt: ${ORIGINS.join(', ')}`);
    }

    if (product?.origin === 'acquired') {
      checkText(report, `${path}.acquiredFrom`, product.acquiredFrom);
      checkDate(report, `${path}.acquisitionDate`, product.acquisitionDate);
    } else {
      if (product?.acquiredFrom !== undefined) {
        report.error(`${path}.acquiredFrom`, "nur bei origin: 'acquired' zulaessig");
      }
      if (product?.acquisitionDate !== undefined) {
        report.error(`${path}.acquisitionDate`, "nur bei origin: 'acquired' zulaessig");
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
    report.error('/', 'die Datei muss ein Objekt enthalten');
    return report;
  }

  // asOf macht laufende Namensperioden reproduzierbar berechenbar. Ohne
  // Tagesgenauigkeit waere die Angabe wertlos.
  if (checkDate(report, 'asOf', data.asOf) && data.asOf.length !== 10) {
    report.error('asOf', `muss tagesgenau sein (YYYY-MM-DD), ist aber ${data.asOf}`);
  }

  const sourcesById = validateSources(report, data.sources);
  const usedSources = validateProducts(report, data.products, sourcesById, data.asOf);

  for (const id of sourcesById.keys()) {
    if (!usedSources.has(id)) report.warn(`sources.${id}`, 'wird von keiner Periode referenziert');
  }

  return report;
}

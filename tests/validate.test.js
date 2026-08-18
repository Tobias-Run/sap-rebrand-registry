import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validate } from '../src/validate.js';

// Kunstprodukte statt echter SAP-Namen: Testdaten sollen nie mit dem
// belegten Datensatz verwechselt werden koennen.
function dataset(overrides = {}) {
  return {
    asOf: '2026-08-18',
    sources: [
      { id: 'src-launch', title: 'Ankuendigung', publisher: 'Beispielverlag', url: 'https://example.org/a', type: 'first-party' },
      { id: 'src-rename', title: 'Umbenennung', publisher: 'Beispielverlag', url: 'https://example.org/b', type: 'first-party' }
    ],
    products: [
      {
        id: 'produkt-alpha',
        emoji: '🧪',
        currentName: 'Alpha Zwei',
        family: 'platform-dev',
        origin: 'organic',
        periods: [
          { name: 'Alpha Eins', start: '2015-03', end: '2020-01-01', qualifier: 'launch', sources: ['src-launch'] },
          { name: 'Alpha Zwei', start: '2020-01-01', qualifier: 'effective', transition: 'rename', sources: ['src-rename'] }
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

test('ein sauberer Datensatz erzeugt weder Fehler noch Warnungen', () => {
  const report = validate(dataset());
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  assert.equal(report.ok, true);
});

test('der leere Ausgangsdatensatz ist gueltig', () => {
  const report = validate({ asOf: '2026-08-18', sources: [], products: [] });
  assert.deepEqual(report.errors, []);
});

test('asOf muss tagesgenau sein', () => {
  assert.match(errorsOf(dataset({ asOf: '2026-08' })), /asOf.*tagesgenau/);
  assert.match(errorsOf(dataset({ asOf: undefined })), /asOf.*fehlt/);
});

test('genau eine laufende Periode je Produkt', () => {
  const zwei = dataset();
  delete firstProduct(zwei).periods[0].end;
  assert.match(errorsOf(zwei), /2 laufende Perioden/);

  const keine = dataset();
  firstProduct(keine).periods[1].end = '2024-01-01';
  assert.match(errorsOf(keine), /keine laufende Periode/);
});

test('die laufende Periode muss die letzte sein', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.periods = [product.periods[1], { ...product.periods[0], transition: 'rename' }];
  product.currentName = 'Alpha Eins';
  assert.match(errorsOf(data), /laufende Periode muss die letzte sein/);
});

test('Perioden muessen lueckenlos aneinander anschliessen', () => {
  const luecke = dataset();
  firstProduct(luecke).periods[0].end = '2019-06-01';
  assert.match(errorsOf(luecke), /Beginn der Folgeperiode/);

  const ueberlappung = dataset();
  firstProduct(ueberlappung).periods[1].start = '2019-01-01';
  assert.match(errorsOf(ueberlappung), /Beginn der Folgeperiode/);
});

test('ein Ende muss nach seinem Beginn liegen', () => {
  const data = dataset();
  firstProduct(data).periods[0].start = '2021-01-01';
  firstProduct(data).periods[0].end = '2020-01-01';
  assert.match(errorsOf(data), /liegt nicht nach Beginn/);
});

test('nichts darf nach asOf liegen', () => {
  const data = dataset();
  firstProduct(data).periods[1].start = '2027-01-01';
  firstProduct(data).periods[0].end = '2027-01-01';
  assert.match(errorsOf(data), /liegt nach asOf/);
});

test('die erste Periode hat keinen Uebergang, jede weitere braucht einen', () => {
  const erste = dataset();
  firstProduct(erste).periods[0].transition = 'rename';
  assert.match(errorsOf(erste), /erste Periode hat keinen Uebergang/);

  const zweite = dataset();
  delete firstProduct(zweite).periods[1].transition;
  assert.match(errorsOf(zweite), /transition.*unbekannt/);

  const unbekannt = dataset();
  firstProduct(unbekannt).periods[1].transition = 'umbenennung';
  assert.match(errorsOf(unbekannt), /transition.*unbekannt/);
});

test('jede Periode braucht mindestens eine aufloesbare Quelle', () => {
  const ohne = dataset();
  firstProduct(ohne).periods[1].sources = [];
  assert.match(errorsOf(ohne), /mindestens eine Quelle/);

  const unbekannt = dataset();
  firstProduct(unbekannt).periods[1].sources = ['src-gibt-es-nicht'];
  assert.match(errorsOf(unbekannt), /nicht auflösbar/);
});

test('nur nachrangige Quellen ergeben eine Warnung, keinen Fehler', () => {
  const data = dataset();
  data.sources[1].type = 'blog';
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /nur nachrangige Quellen/);
});

test('unbenutzte Quellen ergeben eine Warnung', () => {
  const data = dataset();
  data.sources.push({ id: 'src-lose', title: 'Ungenutzt', publisher: 'X', url: 'https://example.org/c', type: 'archive' });
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /von keiner Periode referenziert/);
});

test('acquiredFrom und acquisitionDate haengen an origin', () => {
  const organisch = dataset();
  firstProduct(organisch).acquiredFrom = 'Irgendwer AG';
  assert.match(errorsOf(organisch), /acquiredFrom.*nur bei origin/);

  const zugekauft = dataset();
  firstProduct(zugekauft).origin = 'acquired';
  const fehler = errorsOf(zugekauft);
  assert.match(fehler, /acquiredFrom.*fehlt/);
  assert.match(fehler, /acquisitionDate.*fehlt/);
});

test('eine Eingliederung setzt einen Zukauf voraus', () => {
  const data = dataset();
  firstProduct(data).periods[1].transition = 'assimilation';
  assert.match(errorsOf(data), /'assimilation' setzt origin: 'acquired' voraus/);
});

test('die Eingliederung kann nicht vor dem Zukauf liegen', () => {
  const data = dataset();
  const product = firstProduct(data);
  product.origin = 'acquired';
  product.acquiredFrom = 'Alpha Systems Inc.';
  product.acquisitionDate = '2022-05-01';
  product.periods[1].transition = 'assimilation';
  assert.match(errorsOf(data), /acquisitionDate.*liegt nach der Eingliederung/);
});

test('currentName muss der laufenden Periode entsprechen', () => {
  const data = dataset();
  firstProduct(data).currentName = 'Alpha Drei';
  assert.match(errorsOf(data), /weicht vom Namen der laufenden Periode ab/);
});

test('Produkt-IDs sind eindeutige Slugs', () => {
  const doppelt = dataset();
  doppelt.products.push({ ...firstProduct(doppelt) });
  assert.match(errorsOf(doppelt), /doppelte Produkt-ID/);

  const kruemel = dataset();
  firstProduct(kruemel).id = 'Produkt Alpha';
  assert.match(errorsOf(kruemel), /kein gueltiger Slug/);
});

test('Familie, Herkunft und Qualifier sind geschlossene Wertelisten', () => {
  const data = dataset();
  firstProduct(data).family = 'sonstiges';
  firstProduct(data).origin = 'geerbt';
  firstProduct(data).periods[0].qualifier = 'vermutlich';
  const fehler = errorsOf(data);
  assert.match(fehler, /family.*unbekannt/);
  assert.match(fehler, /origin.*unbekannt/);
  assert.match(fehler, /qualifier.*unbekannt/);
});

test('Quellen brauchen ID, Titel, Herausgeber, URL und Typ', () => {
  const data = dataset();
  data.sources[0] = { id: 'src-launch', title: '', publisher: 'X', url: 'example.org', type: 'zeitung' };
  const fehler = errorsOf(data);
  assert.match(fehler, /title.*fehlt oder ist leer/);
  assert.match(fehler, /url.*http/);
  assert.match(fehler, /type.*unbekannt/);
});

test('doppelte Quellen-IDs fallen auf', () => {
  const data = dataset();
  data.sources.push({ ...data.sources[0] });
  assert.match(errorsOf(data), /doppelte Quellen-ID/);
});

test('grober Unfug bringt den Validator nicht zum Absturz', () => {
  for (const junk of [null, [], 'text', 42]) {
    const report = validate(junk);
    assert.ok(report.errors.length > 0, `${JSON.stringify(junk)} haette Fehler ergeben muessen`);
  }
  assert.ok(validate({ asOf: '2026-08-18', sources: 'nein', products: 'auch nicht' }).errors.length >= 2);
  assert.ok(validate({ asOf: '2026-08-18', sources: [], products: [{}] }).errors.length > 0);
});

test('ein fehlendes Emoji warnt, blockiert aber nicht', () => {
  const data = dataset();
  delete firstProduct(data).emoji;
  const report = validate(data);
  assert.deepEqual(report.errors, []);
  assert.match(report.warnings.join('\n'), /emoji.*kein Emoji/);
});

test('ein Emoji darf keine Buchstaben, Ziffern oder Woerter sein', () => {
  for (const wert of ['SAP', 'x', '1', '']) {
    const data = dataset();
    firstProduct(data).emoji = wert;
    assert.match(errorsOf(data), /emoji/, `${JSON.stringify(wert)} haette abgewiesen werden muessen`);
  }
  const zuLang = dataset();
  firstProduct(zuLang).emoji = '🧪🧪🧪';
  assert.match(errorsOf(zuLang), /emoji.*zu lang/);
});

test('zusammengesetzte Emoji bleiben erlaubt', () => {
  // Variationsselektor und ZWJ-Folge: mehrere Codepunkte, ein Zeichen.
  for (const wert of ['🗄️', '🧑‍🏭', '✈️']) {
    const data = dataset();
    firstProduct(data).emoji = wert;
    assert.deepEqual(validate(data).errors, [], `${wert} haette durchgehen muessen`);
  }
});

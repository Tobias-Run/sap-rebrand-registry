#!/usr/bin/env node
// Finds candidate product names in the cached SEC corpus, instead of starting
// from a list of names somebody already remembered.
//
// The register's first ten products were chosen from memory and then sourced.
// That works, but it can only ever find products someone already thought of,
// which biases the dataset toward whatever was famous. This script inverts it:
// it pulls every "SAP <Something>" phrase out of the corpus, records which
// filings each one appears in, and reports the span. A name that runs for a
// few years and then stops is a rename candidate; a name that starts where
// another stopped is the other half of the same event.
//
// It decides nothing. Every candidate still needs a human to read the context
// and rule out the obvious traps - a trademark list, an OCR-mangled slide, a
// capability inside a product rather than a product.
//
// Usage:
//   node scripts/research/find-name-candidates.mjs [--min-filings=3] [--ended-before=2024]

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SEC_CACHE = new URL('../../.cache/sec/', import.meta.url);
const TWENTY_F_TEXT = process.env.TWENTY_F_TEXT || '/tmp/sec20f/txt';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const MIN_FILINGS = Number(args['min-filings'] ?? 3);
const ENDED_BEFORE = String(args['ended-before'] ?? '');

// "SAP" followed by up to four more tokens: capitalised words, product-style
// tokens like S/4HANA or BW/4HANA, and the small joining words SAP actually
// uses in names ("SAP Cloud for Analytics", "SAP Governance, Risk and
// Compliance").
const NAME = /\bSAP(?:\s+(?:for|and|of|the))?(?:\s+(?:[A-Z][A-Za-z0-9]*(?:\/[A-Z0-9][A-Za-z0-9]*)?|for|and|of|the)){1,4}/g;

// Phrases that are grammar rather than product names.
const STOPWORDS = new Set(['SAP and', 'SAP for', 'SAP of', 'SAP the', 'SAP The', 'SAP In', 'SAP We']);

// The corpus is a pile of financial filings, so most "SAP X" phrases in it are
// legal entities, board bodies and report furniture rather than products.
// These are the shapes that never turn out to be a product name.
const ENTITY = /\b(AG|SE|GmbH|Ltd|Limited|Inc|LLC|LLP|Corp|Corporation|Company|Co|PLC|Pty|BV|NV|SA|SAS|SRL|Holding|Holdings|Beteiligungs\w*|Systems|Systeme|Hosting|Properties|Investment|Ventures|Foundation|Group|Groups)\b/i;
const PLACE = /\b(America|Americas|Asia|Japan|Korea|Deutschland|Germany|France|Belgium|Argentina|Brazil|Australia|Austria|Cyprus|Hong|Kong|India|China|Canada|Mexico|Israel|Sweden|Switzerland|Nederland|Italia|Iberia|EMEA|APJ|Labs|Global|International|National|Regional)\b/i;
const REPORT = /\b(Reports?|Revenue|Results?|Board|Annual|Quarterly|Interim|Financial|Statements?|Shareholders?|Executive|Supervisory|Stock|Share|Dividend|Employees?|Logo|Aktiengesellschaft)\b/i;

function looksLikeProduct(name) {
  if (ENTITY.test(name) || PLACE.test(name) || REPORT.test(name)) return false;
  // Screaming caps are headers and legal names, never product marketing.
  const words = name.split(' ').slice(1);
  if (words.every(w => w === w.toUpperCase() && w.length > 1)) return false;
  // A lone initialism ("SAP GR", "SAP SOP") is a reference, not a name.
  if (words.length === 1 && words[0].length <= 3) return false;
  return true;
}

function trimName(raw) {
  // A name never ends on a joining word: "SAP Cloud for" is a truncation.
  return raw.replace(/\s+(for|and|of|the)$/i, '').trim();
}

async function loadCorpus() {
  const documents = [];

  // 6-K filings, cached as JSON by fetch-sec-filings.mjs
  if (existsSync(SEC_CACHE)) {
    for (const file of (await readdir(SEC_CACHE)).filter(f => f.endsWith('.json') && f !== 'manifest.json')) {
      const filing = JSON.parse(await readFile(new URL(file, SEC_CACHE), 'utf8'));
      const text = filing.exhibits.map(e => e.text).join('\n');
      documents.push({ date: filing.date, form: filing.form, text });
    }
  }

  // 20-F annual reports, as plain text
  if (existsSync(TWENTY_F_TEXT)) {
    for (const file of (await readdir(TWENTY_F_TEXT)).filter(f => f.endsWith('.txt'))) {
      documents.push({
        date: file.replace('.txt', ''),
        form: '20-F',
        text: await readFile(`${TWENTY_F_TEXT}/${file}`, 'utf8')
      });
    }
  }

  return documents.sort((a, b) => a.date.localeCompare(b.date));
}

const corpus = await loadCorpus();
if (corpus.length === 0) {
  console.error('No corpus found. Run fetch-sec-filings.mjs first.');
  process.exit(1);
}
console.log(`${corpus.length} filings, ${corpus[0].date} .. ${corpus[corpus.length - 1].date}\n`);

const seen = new Map(); // name -> Set of filing dates
for (const doc of corpus) {
  const inThisFiling = new Set();
  for (const match of doc.text.matchAll(NAME)) {
    const name = trimName(match[0].replace(/\s+/g, ' '));
    if (name.split(' ').length < 2 || STOPWORDS.has(name)) continue;
    if (!looksLikeProduct(name)) continue;
    inThisFiling.add(name);
  }
  for (const name of inThisFiling) {
    if (!seen.has(name)) seen.set(name, new Set());
    seen.get(name).add(doc.date);
  }
}

const rows = [...seen.entries()]
  .map(([name, dates]) => {
    const sorted = [...dates].sort();
    return { name, filings: sorted.length, first: sorted[0], last: sorted[sorted.length - 1] };
  })
  .filter(r => r.filings >= MIN_FILINGS)
  .filter(r => !ENDED_BEFORE || r.last < ENDED_BEFORE)
  .sort((a, b) => a.first.localeCompare(b.first) || b.filings - a.filings);

console.log(`${rows.length} names in >= ${MIN_FILINGS} filings${ENDED_BEFORE ? `, last seen before ${ENDED_BEFORE}` : ''}:\n`);
console.log('first       last        n   name');
for (const r of rows) {
  console.log(`${r.first}  ${r.last}  ${String(r.filings).padStart(3)}  ${r.name}`);
}

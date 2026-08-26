#!/usr/bin/env node
// Searches the cached SEC corpus (see fetch-sec-filings.mjs) for a term and
// prints one line per filing that mentions it, oldest first, with enough
// context to judge by eye whether the hit is the real product name or noise
// (an OCR-mangled investor deck, a trademark list, an unrelated word).
//
// Usage: node scripts/research/search-corpus.mjs "SAP Analytics Cloud"

import { readdir, readFile } from 'node:fs/promises';

const CACHE = new URL('../../.cache/sec/', import.meta.url);
const term = process.argv[2];
if (!term) {
  console.error('Usage: node scripts/research/search-corpus.mjs "<term>"');
  process.exit(1);
}

const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
const files = (await readdir(CACHE)).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const hits = [];
for (const file of files) {
  const filing = JSON.parse(await readFile(new URL(file, CACHE), 'utf8'));
  for (const exhibit of filing.exhibits) {
    const matches = [...exhibit.text.matchAll(pattern)];
    if (matches.length === 0) continue;
    const first = matches[0];
    const context = exhibit.text
      .slice(Math.max(0, first.index - 90), first.index + term.length + 90)
      .replace(/\s+/g, ' ');
    hits.push({ date: filing.date, form: filing.form, exhibit: exhibit.name, count: matches.length, context });
  }
}

hits.sort((a, b) => a.date.localeCompare(b.date));
console.log(`${hits.length} filing(s) mention "${term}":\n`);
for (const h of hits) {
  console.log(`${h.date}  ${h.form.padEnd(4)} ${h.exhibit.padEnd(24)} (${h.count}x)`);
  console.log(`  ...${h.context}...\n`);
}

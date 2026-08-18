#!/usr/bin/env node
// Downloads SAP's SEC filing corpus (20-F and 6-K) and caches it as plain
// text under .cache/sec/. Re-run any time; already-cached filings are
// skipped, so this is safe to run repeatedly as new filings appear.
//
// Usage: node scripts/research/fetch-sec-filings.mjs [--forms=20-F,6-K] [--since=1998-01-01]

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CIK = '1000184'; // SAP SE
const UA = 'SAP Rebrand Registry research (contact: fp8cdjk57t@privaterelay.appleid.com)';
const CACHE = new URL('../../.cache/sec/', import.meta.url);

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const wantForms = new Set((args.forms ?? '20-F,6-K').split(','));
const since = args.since ?? '1998-01-01';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Strips markup to plain text. Good enough for keyword search across a large
// corpus; not meant to preserve layout.
function htmlToText(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

async function listExhibits(accession, primaryDoc) {
  const flat = accession.replace(/-/g, '');
  const index = await fetchJson(`https://www.sec.gov/Archives/edgar/data/${CIK}/${flat}/index.json`);
  return index.directory.item
    .filter(item => /\.(htm|txt)$/i.test(item.name) && !/index/i.test(item.name))
    .map(item => item.name);
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  const manifestPath = new URL('manifest.json', CACHE);
  const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};

  const submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${CIK.padStart(10, '0')}.json`);
  const recent = submissions.filings.recent;
  const rows = recent.form.map((form, i) => ({
    form, date: recent.filingDate[i], accession: recent.accessionNumber[i], doc: recent.primaryDocument[i]
  })).filter(r => wantForms.has(r.form) && r.date >= since);

  console.log(`${rows.length} filings match (${[...wantForms].join(', ')}, since ${since}).`);

  let fetched = 0, skipped = 0, failed = 0;
  for (const row of rows) {
    const id = `${row.date}-${row.accession}`;
    if (manifest[id]?.status === 'ok') { skipped++; continue; }
    try {
      const exhibits = await listExhibits(row.accession, row.doc);
      // The primary document of a 6-K is a cover page; the substance is in
      // the exhibits (usually ex99-*). Cache every exhibit, largest first.
      const texts = [];
      for (const name of exhibits) {
        const flat = row.accession.replace(/-/g, '');
        const url = `https://www.sec.gov/Archives/edgar/data/${CIK}/${flat}/${name}`;
        const html = await fetchText(url);
        texts.push({ name, text: htmlToText(html) });
        await new Promise(r => setTimeout(r, 250)); // stay well under SEC's rate limit
      }
      const outName = `${id}.json`;
      await writeFile(new URL(outName, CACHE), JSON.stringify({
        form: row.form, date: row.date, accession: row.accession, exhibits: texts
      }));
      manifest[id] = { status: 'ok', form: row.form, date: row.date, file: outName };
      fetched++;
      if (fetched % 20 === 0) console.log(`  ...${fetched} fetched so far`);
    } catch (error) {
      manifest[id] = { status: 'error', form: row.form, date: row.date, error: error.message };
      failed++;
    }
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  console.log(`Done. Fetched ${fetched}, already cached ${skipped}, failed ${failed}.`);
}

main();

#!/usr/bin/env node
// Reads historical sap.com pages out of Common Crawl.
//
// Why this exists: sap.com answers automated requests with 403 and the Wayback
// Machine throttles this environment to a standstill, so SAP's own marketing
// pages - the place a product name actually appears first - looked unreachable.
// Common Crawl holds the same pages, crawled and dated, behind a different
// door: a CDX index that says which captures exist, and a data server that
// serves the captured bytes by byte range out of the WARC they live in.
//
// Usage:
//   node scripts/research/common-crawl.mjs list   CC-MAIN-2017-51 "www.sap.com/products/*"
//   node scripts/research/common-crawl.mjs search CC-MAIN-2017-51 "www.sap.com/products/*" "SAP Cloud Platform"
//
// Captures are cached under .cache/commoncrawl/ so a term can be re-searched
// without re-fetching. That matters more than usual here: the index server
// rate-limits hard (503) after a handful of queries, while the data server
// does not. Query the index rarely, fetch bodies freely.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const UA = 'SAP Rebrand Registry research (contact: fp8cdjk57t@privaterelay.appleid.com)';
const CACHE = new URL('../../.cache/commoncrawl/', import.meta.url);

async function get(url, headers = {}, tries = 6) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
      if (res.status === 404) return null;           // "no captures" is an answer, not a failure
      if (res.status === 503) throw new Error('503 (index server is rate-limiting)');
      if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      if (attempt === tries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
    }
  }
}

// The CDX index only does prefix matching - "sap.com/products/*" works,
// "sap.com/*cloud*" silently returns nothing. Filter on the URL yourself.
export async function listCaptures(crawl, urlPattern, limit = 300) {
  const cacheFile = new URL(`${crawl}-${urlPattern.replace(/[^a-z0-9]+/gi, '_')}.json`, CACHE);
  if (existsSync(cacheFile)) return JSON.parse(await readFile(cacheFile, 'utf8'));

  const url = `https://index.commoncrawl.org/${crawl}-index`
    + `?url=${encodeURIComponent(urlPattern)}&output=json&limit=${limit}`;
  const res = await get(url);
  const records = res
    ? (await res.text()).trim().split('\n').filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean)
    : [];

  await mkdir(CACHE, { recursive: true });
  await writeFile(cacheFile, JSON.stringify(records, null, 1));
  return records;
}

// Only 200-status HTML captures carry a page body worth reading; the index
// also lists redirects and error pages.
export function fetchable(records) {
  return records.filter(r => r.status === '200' && (r.mime || '').includes('html'));
}

export async function fetchBody(record) {
  const offset = Number(record.offset);
  const res = await get(`https://data.commoncrawl.org/${record.filename}`,
    { Range: `bytes=${offset}-${offset + Number(record.length) - 1}` });
  if (!res) return '';
  let raw;
  try { raw = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8'); } catch { return ''; }
  // A WARC record is: WARC headers, blank line, HTTP headers, blank line, body.
  return raw.split('\r\n\r\n').slice(2).join('\r\n\r\n');
}

export function toText(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const [command, crawl, pattern, term] = process.argv.slice(2);
  if (!command || !crawl || !pattern) {
    console.error('Usage: common-crawl.mjs list|search <crawl> <url-prefix> [term]');
    process.exit(1);
  }

  const records = await listCaptures(crawl, pattern);
  const usable = fetchable(records);
  console.log(`${crawl} ${pattern}: ${records.length} captures, ${usable.length} fetchable`);

  if (command === 'list') {
    for (const record of usable.slice(0, 40)) console.log(`  ${record.timestamp}  ${record.url}`);
    return;
  }

  if (!term) { console.error('search needs a term'); process.exit(1); }
  let hits = 0;
  for (const record of usable) {
    let text = '';
    try { text = toText(await fetchBody(record)); } catch { continue; }
    if (!text.includes(term)) continue;
    hits += 1;
    const at = text.indexOf(term);
    const context = text.slice(Math.max(0, at - 90), at + term.length + 90);
    console.log(`  ${record.timestamp}  ${record.url}\n    ...${context}...`);
    if (hits >= 15) break;
  }
  console.log(`\n${hits} page(s) mention "${term}".`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();

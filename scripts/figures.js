#!/usr/bin/env node
// The README quotes seven figures about the dataset. They went stale twice
// before this script existed - once for the median life of a name, once for the
// count of running names - so they are computed here and checked in CI rather
// than retyped by hand.
import { readFile, writeFile } from 'node:fs/promises';
import { buildRegistry } from '../src/model.js';
import { validate } from '../src/validate.js';
import { lifetimeStats, assimilationStats, confirmationStats } from '../src/stats.js';
import { formatDuration } from '../src/dates.js';

const readmePath = new URL('../README.md', import.meta.url);
const dataPath = new URL('../src/data/products.json', import.meta.url);

const data = JSON.parse(await readFile(dataPath, 'utf8'));
const { products } = buildRegistry(data);
const report = validate(data);

const periods = products.flatMap(product => product.periods);
const earliest = periods
  .map(period => period.start)
  .filter(Boolean)
  .sort()[0]
  .slice(0, 4);
const allFirstParty = data.sources.every(source => source.type === 'first-party');
const confirmed = confirmationStats(products);

export const FIGURES = [
  ['Products', `${products.length}`],
  ['Name periods', `${periods.length}, reaching back to ${earliest}`],
  ['Renames counted', `${periods.filter(period => period.transition === 'rename').length}`],
  ['Sources', `${data.sources.length}${allFirstParty ? ', every one of them first-party' : ''}`],
  ['Median life of a name', formatDuration(lifetimeStats(products).median)],
  ['Median time to SAP-ification', formatDuration(assimilationStats(products).median)],
  ['Running names not seen in three years', `${confirmed.stale.length} of ${products.length}`],
  ['Validator warnings', `${report.warnings.length}`],
];

const TABLE = ['| | |', '| --- | --- |', ...FIGURES.map(([k, v]) => `| ${k} | ${v} |`)].join('\n');
const BLOCK = /\| \| \|\n\| --- \| --- \|\n(?:\|.*\|\n)+/;

const readme = await readFile(readmePath, 'utf8');
const found = readme.match(BLOCK);
if (!found) {
  console.error('Could not find the figures table in README.md.');
  process.exit(1);
}

if (process.argv.includes('--write')) {
  await writeFile(readmePath, readme.replace(BLOCK, `${TABLE}\n`));
  console.log('README figures table rewritten.');
  process.exit(0);
}

if (found[0].trim() === TABLE) {
  console.log('README figures match the dataset.');
  process.exit(0);
}

console.error('README figures are out of date. Run `npm run figures -- --write`.\n');
console.error('Expected:\n' + TABLE + '\n\nFound:\n' + found[0].trim());
process.exit(1);

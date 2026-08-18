#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { validate } from '../src/validate.js';

const path = new URL('../src/data/products.json', import.meta.url);

let data;
try {
  data = JSON.parse(await readFile(path, 'utf8'));
} catch (error) {
  console.error(`Could not read products.json: ${error.message}`);
  process.exit(1);
}

const report = validate(data);

for (const warning of report.warnings) console.warn(`Warning  ${warning}`);
for (const error of report.errors) console.error(`Error    ${error}`);

const products = Array.isArray(data.products) ? data.products.length : 0;
const periods = (data.products ?? []).reduce((sum, product) => sum + (product.periods?.length ?? 0), 0);
const sources = Array.isArray(data.sources) ? data.sources.length : 0;

if (report.ok) {
  console.log(`All good: ${products} products, ${periods} name periods, ${sources} sources, ${report.warnings.length} warnings.`);
  process.exit(0);
}

console.error(`\n${report.errors.length} errors in products.json.`);
process.exit(1);

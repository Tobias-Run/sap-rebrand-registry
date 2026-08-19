// The register page. It reads products.json and renders it; every number on
// screen comes out of model.js. Nothing here knows a fact about SAP.

import {
  FAMILIES, FAMILY_LABELS, QUALIFIER_LABELS, TRANSITIONS, TRANSITION_LABELS,
  WEAK_SOURCE_TYPES
} from './constants.js';
import { formatDate, formatDuration } from './dates.js';
import { buildRegistry, selectProducts, SORTS } from './model.js';

const state = { query: '', families: [], transitions: [], sort: 'name' };
let registry = null;

const el = id => document.getElementById(id);

function text(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

/* ---------- controls ---------- */

function chip(label, active, onClick) {
  const button = text('button', 'chip', label);
  button.type = 'button';
  button.setAttribute('aria-pressed', String(active));
  button.addEventListener('click', onClick);
  return button;
}

function toggle(list, value) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

function renderControls() {
  const families = el('families');
  families.replaceChildren(...FAMILIES.map(family =>
    chip(FAMILY_LABELS[family], state.families.includes(family), () => {
      state.families = toggle(state.families, family);
      render();
    })));

  const transitions = el('transitions');
  transitions.replaceChildren(...TRANSITIONS.map(transition =>
    chip(TRANSITION_LABELS[transition], state.transitions.includes(transition), () => {
      state.transitions = toggle(state.transitions, transition);
      render();
    })));
}

function setUpInputs() {
  const search = el('q');
  search.value = state.query;
  search.addEventListener('input', () => {
    state.query = search.value;
    render();
  });

  const sort = el('sort');
  sort.replaceChildren(...Object.entries(SORTS).map(([key, { label }]) => {
    const option = text('option', null, label);
    option.value = key;
    return option;
  }));
  sort.value = state.sort;
  sort.addEventListener('change', () => {
    state.sort = sort.value;
    render();
  });
}

/* ---------- header tallies ---------- */

function tallyItem(value, label) {
  const item = document.createElement('li');
  item.append(text('b', null, String(value)), document.createTextNode(label));
  return item;
}

function renderTally() {
  const renames = registry.products.reduce((sum, product) => sum + product.renameCount, 0);
  el('tally').replaceChildren(
    tallyItem(registry.products.length, 'products'),
    tallyItem(registry.periodCount, 'name periods'),
    tallyItem(renames, 'renames'),
    tallyItem(registry.sourceCount, 'sources')
  );
  el('asof').textContent =
    `Figures are calculated against ${formatDate(registry.asOf)}, not against your clock, `
    + 'so every number on this page is reproducible.';
}

/* ---------- one product ---------- */

function sourceLine(source) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = source.url;
  link.rel = 'noopener';
  link.textContent = source.title;
  item.append(link, document.createTextNode(` — ${source.publisher}`));
  if (source.published) item.append(document.createTextNode(`, ${formatDate(source.published)}`));
  if (WEAK_SOURCE_TYPES.includes(source.type)) {
    item.append(document.createTextNode(' '), text('span', 'badge weak', source.type));
  }
  return item;
}

function periodWhen(period, asOf) {
  const from = formatDate(period.start);
  const until = period.end ? formatDate(period.end) : `${formatDate(asOf)} (current)`;
  const qualifier = QUALIFIER_LABELS[period.qualifier] ?? period.qualifier;
  const line = text('div', 'period-when');
  line.append(
    text('span', 'dates', `${from} → ${until}`),
    document.createTextNode(`  ·  ${qualifier}  ·  ${formatDuration(period.months)}`)
  );
  if (period.wave) {
    line.append(document.createTextNode(`  ·  part of the ${period.wave} wave`));
  }
  return line;
}

function renderPeriod(period, asOf, isLast) {
  const item = document.createElement('li');
  item.className = isLast ? 'is-current' : 'is-superseded';

  const heading = text('div', 'period-name');
  heading.append(document.createTextNode(period.name));
  if (period.transition) {
    heading.append(
      document.createTextNode(' '),
      text('span', `badge ${period.transition}`, TRANSITION_LABELS[period.transition])
    );
  }
  if (period.revert) {
    // A revert is still a rename (it still counts), but it went back to a
    // name this product already carried - worth flagging as such rather than
    // reading as a name nobody has seen before.
    heading.append(document.createTextNode(' '), text('span', 'badge neutral', 'revert'));
  }

  const sources = text('ul', 'sources');
  sources.replaceChildren(...period.sources.map(sourceLine));

  item.append(heading, periodWhen(period, asOf), sources);
  return item;
}

function productMeta(product) {
  const meta = text('p', 'meta');
  const parts = [product.familyLabel];

  if (product.origin === 'acquired') {
    parts.push(`acquired from ${product.acquiredFrom}, ${formatDate(product.acquisitionDate)}`);
    if (product.monthsToAssimilation !== null) {
      parts.push(`SAP prefix after ${formatDuration(product.monthsToAssimilation)}`);
    }
  } else {
    parts.push('grown in-house');
  }

  parts.push(product.renameCount === 1 ? '1 rename' : `${product.renameCount} renames`);
  parts.push(`current name for ${formatDuration(product.currentNameMonths)}`);

  if (product.predecessor) {
    // Runs alongside its predecessor rather than replacing it - SAP ERP next
    // to SAP S/4HANA is the case this exists for. See SCHEMA.md, "predecessors
    // that keep running": recorded as a link between two products, not as one
    // chain of periods pretending the older name ended.
    parts.push(`runs alongside ${product.predecessor.currentName}`);
  }
  if (product.successors.length > 0) {
    const names = product.successors.map(successor => successor.currentName).join(', ');
    parts.push(`later joined by ${names}`);
  }

  parts.forEach((part, index) => {
    if (index > 0) meta.append(text('span', 'sep', '·'));
    meta.append(document.createTextNode(part));
  });
  return meta;
}

function renderProduct(product, asOf) {
  const article = text('article', 'product');
  article.id = product.id;

  const header = document.createElement('header');
  header.append(
    text('span', 'mark', product.emoji ?? '•'),
    text('h2', null, product.currentName),
    text('span', 'badge neutral', product.origin)
  );

  const chain = text('ol', 'chain');
  chain.replaceChildren(...product.periods.map((period, index) =>
    renderPeriod(period, asOf, index === product.periods.length - 1)));

  article.append(header, productMeta(product), chain);
  return article;
}

/* ---------- render ---------- */

function render() {
  renderControls();
  const shown = selectProducts(registry.products, state);
  const list = el('list');

  if (shown.length === 0) {
    list.replaceChildren(text('p', 'empty',
      'Nothing matches those filters. That may mean the product is not in the register yet — '
      + 'an entry only appears once its chain of names can be sourced.'));
  } else {
    list.replaceChildren(...shown.map(product => renderProduct(product, registry.asOf)));
  }

  const total = registry.products.length;
  el('count').textContent = shown.length === total
    ? `Showing all ${total} products.`
    : `Showing ${shown.length} of ${total} products.`;
}

async function start() {
  try {
    const response = await fetch('src/data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    registry = buildRegistry(await response.json());
  } catch (error) {
    el('list').replaceChildren(text('p', 'empty',
      `The dataset could not be loaded (${error.message}). `
      + 'The page is static and reads src/data/products.json directly, so it needs to be '
      + 'served over HTTP rather than opened from disk.'));
    return;
  }
  setUpInputs();
  renderTally();
  render();
}

start();

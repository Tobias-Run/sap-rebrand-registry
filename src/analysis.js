// The analysis page. It renders what stats.js computes and adds nothing of its
// own - no figure is written into this file, and none is carried over from the
// register by hand. Both pages read the same JSON and derive from it.

import { TRANSITION_LABELS } from './constants.js';
import { formatDate, formatDuration } from './dates.js';
import { buildRegistry } from './model.js';
import {
  assimilationStats, familyStats, lifetimeStats, riskIndex, waveStats
} from './stats.js';

const state = { table: false };
let registry = null;

const el = id => document.getElementById(id);

function text(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

/* ---------- scale ---------- */

const TICK_MONTHS = 60; // one gridline every five years

function makeScale(maxMonths) {
  const ceiling = Math.max(TICK_MONTHS, Math.ceil(maxMonths / TICK_MONTHS) * TICK_MONTHS);
  return {
    ceiling,
    percent: months => `${(months / ceiling) * 100}%`,
    ticks: Array.from({ length: ceiling / TICK_MONTHS + 1 }, (_, i) => i * TICK_MONTHS)
  };
}

// The gridlines and the median rule sit in one layer behind every row, offset
// by the label column so they share the bars' x origin without JS having to
// keep two coordinate systems in step.
function plotBackground(scale, reference) {
  const layer = text('div', 'an-grid');
  for (const tick of scale.ticks) {
    const line = text('div', 'an-gridline');
    line.style.left = scale.percent(tick);
    layer.append(line);
  }
  if (reference !== null && reference !== undefined) {
    const rule = text('div', 'an-reference');
    rule.style.left = scale.percent(reference);
    layer.append(rule);
  }
  return layer;
}

function axis(scale, reference, referenceLabel) {
  const row = text('div', 'an-axis');
  const track = text('div', 'an-axis-track');
  for (const tick of scale.ticks) {
    const label = text('span', 'an-tick', tick === 0 ? '0' : `${tick / 12} yrs`);
    label.style.left = scale.percent(tick);
    track.append(label);
  }
  if (reference !== null && reference !== undefined) {
    const label = text('span', 'an-tick an-tick--reference', referenceLabel);
    label.style.left = scale.percent(reference);
    track.append(label);
  }
  row.append(text('div', 'an-axis-spacer'), track);
  return row;
}

/* ---------- tooltip ---------- */

function tooltipEl() {
  let node = el('an-tooltip');
  if (!node) {
    node = text('div', 'an-tooltip');
    node.id = 'an-tooltip';
    node.setAttribute('role', 'status');
    document.body.append(node);
  }
  return node;
}

function showTooltip(target, lines) {
  const node = tooltipEl();
  node.replaceChildren(
    text('div', 'an-tooltip-name', lines[0]),
    text('div', 'an-tooltip-meta', lines.slice(1).join(' · '))
  );
  node.style.display = 'block';
  const box = target.getBoundingClientRect();
  node.style.top = `${window.scrollY + box.top - node.offsetHeight - 8}px`;
  node.style.left = `${Math.max(8, window.scrollX + box.left)}px`;
}

function hideTooltip() {
  const node = el('an-tooltip');
  if (node) node.style.display = 'none';
}

/* ---------- one bar ---------- */

function bar({ label, mark, months, className, scale, href, tooltip, value }) {
  const row = text('div', 'an-row');

  const name = text('div', 'an-row-label');
  if (mark) name.append(text('span', 'an-mark', mark));
  const nameText = text('span', null, label);
  name.append(nameText);
  name.title = label;

  const track = text('div', 'an-track');
  const fill = document.createElement(href ? 'a' : 'div');
  fill.className = `an-bar ${className}`;
  fill.style.width = scale.percent(months);
  if (href) fill.href = href;
  fill.setAttribute('aria-label', `${label}: ${formatDuration(months)}`);

  if (tooltip) {
    fill.addEventListener('mouseenter', () => showTooltip(fill, tooltip));
    fill.addEventListener('focus', () => showTooltip(fill, tooltip));
    fill.addEventListener('mouseleave', hideTooltip);
    fill.addEventListener('blur', hideTooltip);
  }

  track.append(fill);
  if (value) track.append(text('span', 'an-value', value));

  row.append(name, track);
  return row;
}

function dataTable(headings, rows) {
  const table = text('table', 'an-table');
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.replaceChildren(...headings.map(heading => text('th', null, heading)));
  head.append(headRow);

  const body = document.createElement('tbody');
  for (const cells of rows) {
    const tr = document.createElement('tr');
    tr.replaceChildren(...cells.map((cell, index) =>
      text(index === 0 ? 'th' : 'td', null, cell)));
    body.append(tr);
  }

  table.append(head, body);
  return table;
}

/* ---------- hero figures ---------- */

function heroItem(value, label, note) {
  const item = document.createElement('li');
  item.append(text('b', null, value), text('span', 'an-hero-label', label));
  if (note) item.append(text('span', 'an-hero-note', note));
  return item;
}

function renderHero(lifetimes, assimilation) {
  const renames = registry.products.reduce((sum, product) => sum + product.renameCount, 0);
  el('an-hero').replaceChildren(
    heroItem(
      formatDuration(lifetimes.median),
      'median life of a name',
      `across ${lifetimes.renamed.length} names that were replaced`
    ),
    heroItem(
      formatDuration(lifetimes.medianRunning),
      'median age of a current name',
      `${lifetimes.censored} names still in force`
    ),
    heroItem(
      formatDuration(assimilation.median),
      'median time to SAP-ification',
      `${assimilation.entries.length} acquired products`
    ),
    heroItem(String(renames), 'renames counted', 'assimilations and generation changes excluded')
  );
}

/* ---------- how long a name lasts ---------- */

const ENDED_BY_CLASS = {
  rename: 'an-bar--rename',
  assimilation: 'an-bar--assimilation',
  generation: 'an-bar--generation',
  running: 'an-bar--running'
};

const ENDED_BY_LABEL = {
  ...TRANSITION_LABELS,
  running: 'Still in use'
};

function renderLifetimesLegend() {
  const legend = el('an-lifetimes-legend');
  legend.replaceChildren(...['rename', 'assimilation', 'generation', 'running'].map(kind => {
    const item = text('span', 'an-legend-item');
    item.append(
      text('span', `an-swatch ${ENDED_BY_CLASS[kind]}`),
      text('span', null, kind === 'running' ? ENDED_BY_LABEL[kind] : `Ended by ${ENDED_BY_LABEL[kind].toLowerCase()}`)
    );
    return item;
  }));
  legend.hidden = state.table;
}

function renderLifetimes(lifetimes) {
  el('an-lifetimes-lede').textContent =
    `Every name period in the register, longest first. Half of the ${lifetimes.renamed.length} names `
    + `that have been replaced lasted ${formatDuration(lifetimes.median)} or less. The shortest was `
    + `${lifetimes.shortest.period.name} at ${formatDuration(lifetimes.shortest.months)}; the longest `
    + `to be replaced was ${lifetimes.longest.period.name} at ${formatDuration(lifetimes.longest.months)}.`;

  const sorted = [...lifetimes.all].sort((a, b) => b.months - a.months);
  const target = el('an-lifetimes');

  if (state.table) {
    target.replaceChildren(dataTable(
      ['Name', 'Product', 'From', 'To', 'Length', 'Ended by'],
      sorted.map(entry => [
        entry.period.name,
        entry.product.currentName,
        formatDate(entry.period.start),
        entry.period.end ? formatDate(entry.period.end) : '—',
        formatDuration(entry.months),
        ENDED_BY_LABEL[entry.endedBy]
      ])
    ));
    return;
  }

  const scale = makeScale(Math.max(...lifetimes.all.map(entry => entry.months)));
  const plot = text('div', 'an-plot');
  plot.append(
    plotBackground(scale, lifetimes.median),
    ...sorted.map(entry => bar({
      label: entry.period.name,
      mark: entry.product.emoji,
      months: entry.months,
      className: ENDED_BY_CLASS[entry.endedBy],
      scale,
      href: `index.html#${entry.product.id}`,
      tooltip: [
        entry.period.name,
        formatDuration(entry.months),
        entry.period.end
          ? `${formatDate(entry.period.start)} → ${formatDate(entry.period.end)}`
          : `since ${formatDate(entry.period.start)}`,
        ENDED_BY_LABEL[entry.endedBy]
      ]
    }))
  );

  target.replaceChildren(plot, axis(scale, lifetimes.median, `median ${formatDuration(lifetimes.median)}`));
}

/* ---------- time to SAP-ification ---------- */

function renderAssimilation(assimilation) {
  el('an-assimilation-lede').textContent =
    `From the day SAP bought the company to the day the product carried the SAP name. `
    + `${assimilation.entries.length} acquired products in the register have both dates on record; `
    + `the median gap is ${formatDuration(assimilation.median)}, and the spread is the interesting part.`;

  const target = el('an-assimilation');

  if (state.table) {
    target.replaceChildren(dataTable(
      ['Product', 'Acquired from', 'Acquired', 'Took the SAP name', 'Gap'],
      assimilation.entries.map(entry => [
        entry.product.currentName,
        entry.product.acquiredFrom,
        formatDate(entry.product.acquisitionDate),
        formatDate(entry.product.periods.find(period => period.transition === 'assimilation').start),
        formatDuration(entry.months)
      ])
    ));
    return;
  }

  const scale = makeScale(Math.max(...assimilation.entries.map(entry => entry.months)));
  const plot = text('div', 'an-plot');
  plot.append(
    plotBackground(scale, assimilation.median),
    // One series, so the bars carry no legend and their value sits at the end
    // of each bar - five rows is few enough for that to read as a list.
    ...assimilation.entries.map(entry => bar({
      label: entry.product.currentName,
      mark: entry.product.emoji,
      months: entry.months,
      className: 'an-bar--assimilation',
      scale,
      href: `index.html#${entry.product.id}`,
      value: formatDuration(entry.months)
    }))
  );

  target.replaceChildren(plot, axis(scale, assimilation.median, `median ${formatDuration(assimilation.median)}`));
}

/* ---------- families, waves, index ---------- */

function renderFamilies(families) {
  el('an-families').replaceChildren(dataTable(
    ['Family', 'Products', 'Renames', 'Median life of a renamed name', 'Evidence'],
    families.map(row => [
      row.label,
      String(row.products),
      String(row.renames),
      row.median === null ? '—' : formatDuration(row.median),
      row.products === 0 ? 'not covered yet' : row.sparse ? 'thin' : 'usable'
    ])
  ));
}

function renderWaves(waves) {
  const list = text('ul', 'an-waves');
  for (const wave of waves) {
    const item = document.createElement('li');
    item.append(
      text('span', 'an-wave-date', formatDate(wave.start)),
      text('b', null, `${wave.products} products`)
    );
    const names = text('div', 'an-wave-names');
    wave.members.forEach((member, index) => {
      if (index > 0) names.append(text('span', 'sep', '·'));
      const link = document.createElement('a');
      link.href = `index.html#${member.product.id}`;
      link.textContent = member.period.name;
      names.append(link);
    });
    item.append(names, text('code', 'an-wave-id', wave.id));
    list.append(item);
  }
  el('an-waves').replaceChildren(list);
}

function renderIndex(rows) {
  el('an-index-lede').textContent =
    'How restless each product has been, on a scale of nothing-has-happened to renamed-repeatedly-'
    + 'and-overdue. Sixty per cent of it is renames per year of recorded history, forty per cent is '
    + 'how far the current name has run against the length that product’s names usually reach.';

  const target = el('an-index');

  if (state.table) {
    target.replaceChildren(dataTable(
      ['Product', 'Index', 'Renames', 'Per year', 'Current name', 'Usual length'],
      rows.map(row => [
        row.product.currentName,
        String(row.score),
        String(row.product.renameCount),
        row.perYear.toFixed(2),
        formatDuration(row.product.currentNameMonths),
        row.reference === null ? '—' : formatDuration(row.reference)
      ])
    ));
    return;
  }

  const list = text('ol', 'an-index-list');
  for (const row of rows) {
    const item = document.createElement('li');
    const label = text('div', 'an-index-name');
    label.append(
      text('span', 'an-mark', row.product.emoji ?? '•'),
      text('span', null, row.product.currentName)
    );

    const meter = text('div', 'an-meter');
    const fill = text('div', 'an-meter-fill');
    fill.style.width = `${row.score}%`;
    meter.append(fill);

    const note = text('div', 'an-index-note', row.product.renameCount === 0
      ? `never renamed · current name for ${formatDuration(row.product.currentNameMonths)}`
      : `${row.product.renameCount} rename${row.product.renameCount === 1 ? '' : 's'} in `
        + `${formatDuration(row.trackedMonths)} · current name for ${formatDuration(row.product.currentNameMonths)}`);

    item.append(label, meter, text('div', 'an-index-score', String(row.score)), note);
    list.append(item);
  }
  target.replaceChildren(list);
}

/* ---------- render ---------- */

function render() {
  const lifetimes = lifetimeStats(registry.products);
  const assimilation = assimilationStats(registry.products);

  renderHero(lifetimes, assimilation);
  renderLifetimesLegend();
  renderLifetimes(lifetimes);
  renderAssimilation(assimilation);
  renderFamilies(familyStats(registry.products));
  renderWaves(waveStats(registry.wavesById));
  renderIndex(riskIndex(registry.products, registry.asOf));

  el('an-asof').textContent =
    `Every figure is calculated against ${formatDate(registry.asOf)} rather than against your clock, `
    + `from ${registry.products.length} products and ${registry.periodCount} name periods.`;
}

async function start() {
  try {
    const response = await fetch('src/data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    registry = buildRegistry(await response.json());
  } catch (error) {
    el('an-hero').replaceChildren(text('p', 'empty',
      `The dataset could not be loaded (${error.message}). `
      + 'The page is static and reads src/data/products.json directly, so it needs to be '
      + 'served over HTTP rather than opened from disk.'));
    return;
  }

  const toggle = el('an-table');
  toggle.checked = state.table;
  toggle.addEventListener('change', () => {
    state.table = toggle.checked;
    hideTooltip();
    render();
  });

  render();
}

start();

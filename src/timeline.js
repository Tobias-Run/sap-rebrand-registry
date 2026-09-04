// The timeline page. Same dataset and the same model.js as the register -
// this page only adds a way to read it: name periods drawn to scale against
// a shared time axis, with SAP's core ERP line pinned at the top as the
// reference frame everything else is read against.
//
// No charting library: date-to-pixel is arithmetic (see makeScale() below),
// and the marks are plain, focusable <button>s positioned with CSS - not a
// dependency the project's other pages don't already carry.

import { FAMILIES, FAMILY_LABELS, QUALIFIER_LABELS, TRANSITION_LABELS } from './constants.js';
import { formatDate, formatDuration, toDate } from './dates.js';
import { buildRegistry } from './model.js';

const ANCHOR_ID = 'sap-erp';
const MS_PER_DAY = 86400000;
const RIGHT_PADDING_DAYS = 365; // breathing room past "today" so it isn't flush against the edge
const ZOOM_LEVELS = [
  { id: 'compact', label: 'Compact', pxPerMonth: 3.5 },
  { id: 'comfortable', label: 'Comfortable', pxPerMonth: 6 },
  { id: 'wide', label: 'Wide', pxPerMonth: 10 }
];
const LABEL_MIN_WIDTH = 70; // px a period needs before its name is drawn inside the bar

const state = { families: [], zoom: 'comfortable', showGeneration: false };
let registry = null;
let originDate = null; // the calendar date at x = 0
let pinned = null; // { product, period } currently shown in the detail panel

const el = id => document.getElementById(id);

function text(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

/* ---------- the scale ---------- */

function daysBetween(a, b) {
  return (toDate(b).getTime() - toDate(a).getTime()) / MS_PER_DAY;
}

function makeScale(pxPerMonth) {
  const pxPerDay = pxPerMonth / 30.4368; // average month length; a chart, not a calendar
  return dateStr => daysBetween(originDate, dateStr) * pxPerDay;
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
  // Every family gets a chip, erp-suite included. It used to be left out
  // because the anchor row is shown whatever the filter says, so filtering by
  // the anchor's own family looked like a no-op - true when erp-suite held
  // only SAP ERP, wrong now that it holds four products.
  el('tl-families').replaceChildren(...FAMILIES
    .map(family => chip(FAMILY_LABELS[family], state.families.includes(family), () => {
      state.families = toggle(state.families, family);
      render();
    })));

  el('tl-zoom').replaceChildren(...ZOOM_LEVELS.map(level =>
    chip(level.label, state.zoom === level.id, () => {
      state.zoom = level.id;
      render();
      jumpToToday();
    })));
}

function setUpStaticControls() {
  const generationToggle = el('tl-show-generation');
  generationToggle.checked = state.showGeneration;
  generationToggle.addEventListener('change', () => {
    state.showGeneration = generationToggle.checked;
    render();
  });
  el('tl-jump-today').addEventListener('click', jumpToToday);
}

/* ---------- legend ---------- */

function legendItem(className, label) {
  const item = text('span', 'tl-legend-item');
  item.append(text('span', `tl-swatch ${className}`), document.createTextNode(label));
  return item;
}

function renderLegend() {
  el('tl-legend').replaceChildren(
    legendItem('tl-swatch--start', 'Starting name'),
    legendItem('tl-swatch--rename', 'Rename'),
    legendItem('tl-swatch--assimilation', 'Assimilation'),
    legendItem('tl-swatch--generation', 'Generation'),
    legendItem('tl-swatch--era', 'SAP ERP era (background)')
  );
}

/* ---------- ruler (year + today labels, scrolls with the chart) ---------- */

// A bare year number sitting right next to "Today" is unreadable at any
// zoom level - skip a year label if its gridline falls within a label's
// width of the Today line, rather than trying to out-position them.
const YEAR_COLLISION_PX = 42;

function renderRuler(x, chartEndDate) {
  const spacer = text('div', 'tl-row-label tl-ruler-spacer', 'Product');
  const track = text('div', 'tl-track tl-ruler-track');

  const todayX = x(registry.asOf);
  const startYear = Number(originDate.slice(0, 4));
  const endYear = Number(chartEndDate.slice(0, 4)) + 1;
  for (let year = startYear; year <= endYear; year += 1) {
    const yearX = x(`${year}`);
    if (Math.abs(yearX - todayX) < YEAR_COLLISION_PX) continue;
    const label = text('span', 'tl-year-label', String(year));
    label.style.left = `${yearX}px`;
    track.append(label);
  }
  const today = text('span', 'tl-year-label tl-year-label--today', 'Today');
  today.style.left = `${todayX}px`;
  track.append(today);

  const ruler = el('tl-ruler');
  ruler.replaceChildren(spacer, track);
}

/* ---------- era bands + gridlines (the ERP anchor, as background) ---------- */

function renderEras(anchor, x, endDate) {
  const layer = text('div', 'tl-eras');
  anchor.periods.forEach((period, index) => {
    const start = x(period.start);
    const end = x(period.end ?? endDate);
    const band = text('div', `tl-era tl-era--${index % 2 === 0 ? 'a' : 'b'}`);
    band.style.left = `${start}px`;
    band.style.width = `${Math.max(end - start, 1)}px`;
    layer.append(band);
  });
  return layer;
}

function renderAxisLines(x, chartEndDate) {
  const layer = text('div', 'tl-axis');
  const startYear = Number(originDate.slice(0, 4));
  const endYear = Number(chartEndDate.slice(0, 4)) + 1;
  for (let year = startYear; year <= endYear; year += 1) {
    const gridline = text('div', 'tl-year');
    gridline.style.left = `${x(`${year}`)}px`;
    layer.append(gridline);
  }
  const today = text('div', 'tl-year tl-year--today');
  today.style.left = `${x(registry.asOf)}px`;
  layer.append(today);
  return layer;
}

/* ---------- rows ---------- */

function periodClass(period, showGeneration) {
  if (!period.transition) return 'tl-seg--start';
  if (period.transition === 'generation' && !showGeneration) return 'tl-seg--muted';
  return `tl-seg--${period.transition}`;
}

function renderSegment(product, period, x, showGeneration, endDate) {
  const start = x(period.start);
  const end = x(period.end ?? endDate);
  const width = Math.max(end - start, 1);

  const button = text('button', `tl-seg ${periodClass(period, showGeneration)}`);
  button.type = 'button';
  button.style.left = `${start}px`;
  button.style.width = `${width}px`;
  button.setAttribute('aria-label',
    `${product.currentName}: ${period.name}, ${formatDate(period.start)} to ${period.end ? formatDate(period.end) : 'now'}`);

  if (width >= LABEL_MIN_WIDTH) {
    button.append(text('span', 'tl-seg-label', period.name));
  }

  button.addEventListener('mouseenter', () => showTooltip(button, period));
  button.addEventListener('focus', () => showTooltip(button, period));
  button.addEventListener('mouseleave', hideTooltip);
  button.addEventListener('blur', hideTooltip);
  button.addEventListener('click', () => pinDetail(product, period, button));

  return button;
}

function renderRow(product, x, showGeneration, endDate, isAnchor) {
  const label = text('div', isAnchor ? 'tl-row-label tl-row-label--anchor' : 'tl-row-label');
  label.title = product.currentName; // native tooltip for names the fixed-width column truncates
  label.append(text('span', 'tl-row-mark', product.emoji ?? '•'), text('span', null, product.currentName));

  const track = text('div', isAnchor ? 'tl-track tl-track--anchor' : 'tl-track');
  track.append(...product.periods.map(period => renderSegment(product, period, x, showGeneration, endDate)));

  return [label, track];
}

/* ---------- tooltip (hover/focus - transient, text only) ---------- */

function tooltipEl() {
  let node = el('tl-tooltip');
  if (!node) {
    node = text('div', 'tl-tooltip');
    node.id = 'tl-tooltip';
    node.hidden = true;
    document.body.append(node);
  }
  return node;
}

function showTooltip(target, period) {
  const node = tooltipEl();
  const qualifier = QUALIFIER_LABELS[period.qualifier] ?? period.qualifier;
  const range = `${formatDate(period.start)} → ${period.end ? formatDate(period.end) : 'now'}`;
  node.replaceChildren(
    text('div', 'tl-tooltip-name', period.name),
    text('div', 'tl-tooltip-meta', `${range} · ${qualifier} · ${formatDuration(period.months)}`)
  );
  node.hidden = false;
  const rect = target.getBoundingClientRect();
  const top = rect.top + window.scrollY - node.offsetHeight - 8;
  const left = Math.min(
    Math.max(rect.left + window.scrollX, 8),
    window.scrollX + document.documentElement.clientWidth - node.offsetWidth - 8
  );
  node.style.top = `${Math.max(top, 8)}px`;
  node.style.left = `${left}px`;
}

function hideTooltip() {
  const node = el('tl-tooltip');
  if (node) node.hidden = true;
}

/* ---------- detail panel (click/Enter - pinned, with real links) ---------- */

function pinDetail(product, period, target) {
  // Once pinned, the panel below is the source of truth; the transient hover
  // tooltip has to go, or it sits there forever after a keyboard Enter (no
  // mouseleave ever fires while focus stays on the button).
  hideTooltip();
  document.querySelectorAll('.tl-seg[aria-pressed="true"]').forEach(node => node.removeAttribute('aria-pressed'));
  target.setAttribute('aria-pressed', 'true');
  pinned = { product, period };
  renderDetail();
}

function renderDetail() {
  const panel = el('tl-detail');
  if (!pinned) { panel.hidden = true; return; }
  const { product, period } = pinned;
  panel.hidden = false;
  panel.replaceChildren();

  const heading = text('h2', null, `${product.emoji ?? ''} ${period.name}`.trim());
  let subText = `${product.currentName} · ${product.familyLabel} · ${formatDate(period.start)} → `
    + `${period.end ? formatDate(period.end) : 'now'} · ${QUALIFIER_LABELS[period.qualifier] ?? period.qualifier}`
    + (period.transition ? ` · ${TRANSITION_LABELS[period.transition]}` : ' · starting name');
  if (period.revert) subText += ' (revert)';
  if (period.wave) subText += ` · part of the ${period.wave} wave`;
  if (product.predecessor) subText += ` · runs alongside ${product.predecessor.currentName}`;
  const sub = text('p', 'tl-detail-sub', subText);

  const sources = text('ul', 'sources');
  sources.replaceChildren(...period.sources.map(source => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.rel = 'noopener';
    link.textContent = source.title;
    item.append(link, document.createTextNode(` — ${source.publisher}`));
    return item;
  }));

  const close = text('button', 'chip', 'Close');
  close.type = 'button';
  close.addEventListener('click', () => {
    pinned = null;
    document.querySelectorAll('.tl-seg[aria-pressed="true"]').forEach(node => node.removeAttribute('aria-pressed'));
    renderDetail();
  });

  panel.append(heading, sub, sources, close);
}

/* ---------- scroll to today ---------- */

function jumpToToday() {
  const scroller = el('tl-scroll');
  const todayLine = scroller.querySelector('.tl-year--today');
  if (!todayLine) return;
  const todayLeft = parseFloat(todayLine.style.left);
  const labelWidth = scroller.querySelector('.tl-row-label')?.offsetWidth ?? 0;
  scroller.scrollLeft = Math.max(0, labelWidth + todayLeft - (scroller.clientWidth - labelWidth) / 2);
}

/* ---------- render ---------- */

function render() {
  renderControls();

  const anchor = registry.products.find(product => product.id === ANCHOR_ID);
  const others = registry.products
    .filter(product => product.id !== ANCHOR_ID)
    .filter(product => state.families.length === 0 || state.families.includes(product.family))
    .sort((a, b) => a.periods[0].start.localeCompare(b.periods[0].start));

  const pxPerMonth = ZOOM_LEVELS.find(level => level.id === state.zoom).pxPerMonth;
  const scale = makeScale(pxPerMonth);
  const endDate = registry.asOf;
  const chartEndDate = new Date(toDate(registry.asOf).getTime() + RIGHT_PADDING_DAYS * MS_PER_DAY)
    .toISOString().slice(0, 10);
  const trackWidth = Math.ceil(scale(chartEndDate));

  const chart = el('tl-chart');
  chart.style.setProperty('--tl-track-width', `${trackWidth}px`);
  el('tl-ruler').style.setProperty('--tl-track-width', `${trackWidth}px`);

  const rows = [anchor, ...others].flatMap((product, index) =>
    renderRow(product, scale, state.showGeneration, endDate, index === 0));

  chart.replaceChildren(renderEras(anchor, scale, endDate), renderAxisLines(scale, chartEndDate), ...rows);
  renderRuler(scale, chartEndDate);

  el('tl-count').textContent = state.families.length === 0
    ? `Showing all ${others.length + 1} products.`
    : `Showing ${others.length + 1} of ${registry.products.length} products.`;

  renderDetail();
}

async function start() {
  try {
    const response = await fetch('src/data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    registry = buildRegistry(await response.json());
  } catch (error) {
    el('tl-chart').replaceChildren(text('p', 'empty', `The dataset could not be loaded (${error.message}).`));
    return;
  }

  const earliest = registry.products.reduce(
    (min, product) => (product.periods[0].start < min ? product.periods[0].start : min),
    registry.products[0].periods[0].start
  );
  originDate = `${earliest.slice(0, 4)}-01-01`;

  setUpStaticControls();
  renderLegend();
  render();
  jumpToToday();
  el('tl-asof').textContent =
    `Positions are calculated against ${formatDate(registry.asOf)}, the same reference date as the register.`;
}

start();

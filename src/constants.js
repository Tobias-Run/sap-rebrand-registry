// Six product families. Enough to show a pattern, few enough that no group
// shrinks to two products.
//
// There were seven. 'industry-clouds' was retired after two searches of the
// corpus turned up nothing that belongs in it - SAP sells its industry
// business as portfolios and packages rather than as separately branded
// products, so there is nothing there to rename. A filter that always returns
// nothing is worse than an absent one. See SCHEMA.md, "A family that was
// retired"; adding it back costs three lines if a case ever appears.
export const FAMILIES = [
  'erp-suite',
  'hcm',
  'spend-travel',
  'cx',
  'data-analytics',
  'platform-dev'
];

export const FAMILY_LABELS = {
  'erp-suite': 'ERP & Suite',
  'hcm': 'HCM',
  'spend-travel': 'Spend & Travel',
  'cx': 'CX',
  'data-analytics': 'Data & Analytics',
  'platform-dev': 'Platform & Dev'
};

// How solid is the date? 'by' means: earliest provable mention. The real
// start may lie before it.
export const QUALIFIERS = ['launch', 'announcement', 'effective', 'by'];

export const QUALIFIER_LABELS = {
  launch: 'launched',
  announcement: 'announced',
  effective: 'effective',
  by: 'in use by'
};

// Kind of transition *into* this period. A product's first period has no
// transition; it is the starting state.
export const TRANSITIONS = ['rename', 'assimilation', 'generation'];

export const TRANSITION_LABELS = {
  rename: 'Rename',
  assimilation: 'Assimilation',
  generation: 'Generation'
};

// Only 'rename' feeds the median, family frequency and index. Assimilation
// after an acquisition is predictable; a generation change is not a rebrand.
export const COUNTED_TRANSITIONS = ['rename'];

export const ORIGINS = ['organic', 'acquired'];

// Source ranking per section 7 of the brief. 'analyst' and 'blog' rank below
// the rest and are marked as such in the interface.
export const SOURCE_TYPES = ['first-party', 'archive', 'analyst', 'blog'];
export const WEAK_SOURCE_TYPES = ['analyst', 'blog'];

export const SOURCE_TYPE_LABELS = {
  'first-party': 'first-party',
  'archive': 'archive',
  'analyst': 'analyst',
  'blog': 'blog'
};

// A family with fewer completed renames than this counts as thin evidence.
// It gets flagged, not merged into another family.
export const SPARSE_FAMILY_THRESHOLD = 2;

# Changelog

## 1.0.0 — 8 September 2026

First release. The register covers 21 SAP products across 49 name periods,
every one of them carrying a first-party source, reaching back to September 1998.

### The register

- Three static pages served from one dataset: a **register** of every documented
  name period, a **timeline** of the chains against each other, and an
  **analysis** page whose figures are computed rather than written down.
- `src/data/products.json` is the canonical dataset and is published alongside
  the pages under CC BY 4.0, so it can be fetched on its own.

### What the schema learned to say

- **Three kinds of transition.** A `rename` is a plain change of name and the
  only kind that feeds the medians; an `assimilation` is an acquired product
  taking the SAP prefix; a `generation` is a new product and is never counted.
  Keeping them apart is what stops the headline figure from being nonsense.
- **Dates at the precision the source gives.** `YYYY`, `YYYY-MM` or
  `YYYY-MM-DD`, never a day the source did not state, with a `qualifier` saying
  whether the date is a launch, an announcement, an effective date, or merely
  the date by which a document shows the name already in use.
- **`lastConfirmed`.** A running period records the newest document known to use
  its name. Silence is not read as an ending, but the pages say where the
  evidence stops instead of letting an entry imply today. Eight of twenty-one
  running names have not been seen in three years or more.
- **`succeeds`, `wave` and `revert`** for products that hand off to a successor,
  renames that happened together for one announced reason, and names that came
  back. Four waves are recorded; `revert` is defined but not yet exercised.
- Eighteen validator rules, enforced by `npm run validate` and by CI.

### Sources

- SAP's own SEC filings, unbroken since 1999 — Form 20-F annual reports for
  upper bounds, Form 6-K interim reports and press releases to pin the same
  boundary to a quarter or a day.
- Historic `sap.com` pages read out of Common Crawl rather than from `sap.com`
  itself, as a second and independent class of evidence.
- `COMPARABLE-PROJECTS.md` keeps the research log, including the candidate
  sources that were tested and rejected — which is most of them.

### Tooling

- `scripts/research/` holds the corpus tooling for both source classes.
- `scripts/figures.js` recomputes the README's figures from the dataset and
  fails CI when a hand-typed number has drifted. It was added after two
  published numbers went stale unnoticed.

# SAP Rebrand Registry

An independent research project: how often, and when, SAP has renamed its products.

Two static pages, no server logic. A **register** listing every documented name period per product, and an **analysis** that computes median durations, family patterns and a semi-serious risk index from it. Every number is worked out in the browser from a single file. Nothing is carried forward by hand.

**Status:** under construction. The dataset has a sourced core — 14 products, 35 name periods reaching back to 2002, no warnings. The register and timeline pages are up. The analysis page is not written yet.

```bash
npm start      # serves the register at http://localhost:3000
npm run validate
npm test
```

## Published site

The site is static and needs no build step, so GitHub Pages serves the repository as it stands. Once Pages is switched on under Settings → Pages with **GitHub Actions** as the source, `.github/workflows/pages.yml` publishes to:

<https://tobias-run.github.io/sap-rebrand-registry/>

The deploy waits for `npm run validate` and `npm test`. A dataset the validator rejects fails the run rather than reaching the site, which is the same rule the rest of the project follows: no number goes public that has not been checked.

Only `index.html`, `src/` and the two licence files are uploaded. `src/data/products.json` is served alongside the page deliberately — the dataset is CC BY 4.0 and meant to be fetchable on its own.

## Why

Microsoft has one: the [Microsoft Rebrand Registry](https://www.msrebrandregistry.com). SAP has nothing comparable — looked into and written up in [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md). The closest thing is Wikipedia's "List of SAP products", which mentions renames in passing, without dates and without individual sources.

This is a reimplementation, not a fork. [LICENSE-REVIEW.md](LICENSE-REVIEW.md) sets out why it has to be: the model project carries no licence, which means all rights reserved. What is taken from it is the concept and the definition of the metrics, neither of which is protectable. No code, no CSS, no text, no data.

## Evidence

Every name period cites at least one source. The precision of the source is preserved: where only a year is documented, a year is what you get, not an invented day. A qualifier records whether a date marks an announcement, a launch, the day something took effect, or merely the earliest point we can prove.

The load-bearing source for the current dataset is SAP's own filings with the SEC, unbroken since 1999. They are first-party, dated, and they stay online — `news.sap.com` has deleted its older articles, `sap.com` blocks automated requests, and the Wayback Machine throttles. The annual Form 20-F alone gives upper bounds rather than exact dates, since it only appears once a year; SAP's Form 6-K filings - interim reports and press releases, filed through the year rather than once in February - often pin the same rename down to a specific quarter instead, and occasionally catch a boundary the 20-F alone would have missed by years. [SCHEMA.md](SCHEMA.md) explains how the dating is anchored and what it does to the medians.

Resting everything on one filer is its own risk, so a second, independent class of evidence is now reachable too: historical `sap.com` pages, read out of Common Crawl rather than from `sap.com` itself or the Wayback Machine. `scripts/research/` holds the tooling for both corpora, and [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md) records which other candidate sources were tested and what each turned out to be worth — including the ones that failed.

## Three kinds of transition

The heart of the project is a distinction the model project does not need:

- **`rename`** — a plain change of name with the product carrying on. The normal case, and the only category that feeds the median and the index.
- **`assimilation`** — absorption after an acquisition, typically prefixing the SAP name. Predictable, so it sits outside the statistics and gets its own metric instead: time to SAP-ification.
- **`generation`** — a technology or generation change rather than a rebrand. Hidden by default, available through a filter, never in the statistics.

Count all three together and bought-in families look artificially restless, while the index starts predicting renames for products that have long since done their compulsory round.

## What the index is not

The risk index measures historical rename pressure. It is not a probability and says nothing about SAP's plans. That caveat belongs on the analysis page itself, not in the small print.

## Out of scope

Discontinued products, logo history, renamed pricing models, SAP-internal project names. No imagery: no SAP logos, no trademarks as graphics. The site is text and one emoji per product.

## Layout of the repository

| Path | What it holds |
| --- | --- |
| `src/data/products.json` | the dataset, canonical |
| `src/validate.js`, `scripts/validate-data.js` | schema and consistency checks |
| `src/model.js` | every derived figure, shared by both pages |
| `src/dates.js` | dates at mixed precision, without inventing days |
| `src/register.js`, `index.html` | the register page |
| `src/timeline.js`, `timeline.html` | the timeline page - the same periods drawn to scale against SAP's ERP line |
| `src/styles.css` | shared styles for both pages, one token set |
| `scripts/research/` | tooling for the source corpora a citation gets pulled from — SEC filings and Common Crawl (see COMPARABLE-PROJECTS.md) |
| `tests/` | unit tests, run by `npm test` and in CI |

## Considered, not decided

**Anonymous war stories.** Let people say what a rename actually cost them: the migration nobody budgeted for, the sales deck redone twice, the internal wiki that still uses the old name six years later. That is probably the part anyone would read first.

It needs a server, though, and right now there is none. Two static pages read one JSON file, and that is the whole architecture. Accepting text from strangers means storing it, moderating it, and dealing with spam, libel, and people who name their employer without thinking it through. Worth doing later. Not worth doing before the register is finished.

## Licence

Code under the [MIT licence](LICENSE). Dataset under [CC BY 4.0](LICENSE-DATA). Kept apart so the research stays reusable even for someone who has no use for the code.

## Legal

An independent research project with no connection to SAP. Product names and trademarks belong to SAP SE. No claim to completeness.

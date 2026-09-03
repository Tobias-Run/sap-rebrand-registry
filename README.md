# SAP Rebrand Registry

[![CI](https://github.com/Tobias-Run/sap-rebrand-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/Tobias-Run/sap-rebrand-registry/actions/workflows/ci.yml)
[![Deploy to Pages](https://github.com/Tobias-Run/sap-rebrand-registry/actions/workflows/pages.yml/badge.svg)](https://github.com/Tobias-Run/sap-rebrand-registry/actions/workflows/pages.yml)

An independent research project: how often, and when, SAP has renamed its products.

**→ [Open the register](https://tobias-run.github.io/sap-rebrand-registry/)**

| Page | What it does |
| --- | --- |
| [Register](https://tobias-run.github.io/sap-rebrand-registry/) | every documented name a product has carried, with a source for each |
| [Timeline](https://tobias-run.github.io/sap-rebrand-registry/timeline.html) | the same periods drawn to scale, against SAP's ERP line |
| [Analysis](https://tobias-run.github.io/sap-rebrand-registry/analysis.html) | what it adds up to: medians, family patterns, rename pressure |

Three static pages, no server logic. Every number is worked out in the browser from a single JSON file. Nothing is carried forward by hand, and nothing is typed into a page that the validator has not seen first.

## The register right now

| | |
| --- | --- |
| Products | 18 |
| Name periods | 43, reaching back to 2000 |
| Renames counted | 18 |
| Sources | 30, every one of them first-party |
| Median life of a name | 4.0 years |
| Median time to SAP-ification | 11 months |
| Validator warnings | 0 |

The shortest name a product carried before being renamed lasted six months: SAP BusinessObjects Cloud, which held out just about long enough to reach a slide deck. At the other end, five products have worn the same name since 2007, and all five got there the same way — SAP dropped the `mySAP` prefix from the entire Business Suite in one move.

```bash
npm start        # serves the register at http://localhost:3000
npm run validate # schema, contiguity, sources
npm test         # 55 unit tests
```

Node 20+, no dependencies, no build step.

## Why

Microsoft has one: the [Microsoft Rebrand Registry](https://www.msrebrandregistry.com). SAP has nothing comparable — looked into and written up in [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md). The closest thing is Wikipedia's "List of SAP products", which mentions renames in passing, without dates and without individual sources.

This is a reimplementation, not a fork. [LICENSE-REVIEW.md](LICENSE-REVIEW.md) sets out why it has to be: the model project carries no licence, which means all rights reserved. What is taken from it is the concept and the definition of the metrics, neither of which is protectable. No code, no CSS, no text, no data.

## Evidence

Every name period cites at least one source. The precision of the source is preserved: where only a year is documented, a year is what you get, not an invented day. A qualifier records whether a date marks an announcement, a launch, the day something took effect, or merely the earliest point we can prove.

The load-bearing source is SAP's own filings with the SEC, unbroken since 1999. They are first-party, dated, and they stay online — `news.sap.com` has deleted its older articles, `sap.com` blocks automated requests, and the Wayback Machine throttles. The annual Form 20-F gives upper bounds rather than exact dates, since it appears once a year. SAP's Form 6-K filings — interim reports and press releases, filed throughout the year — often pin the same rename down to a quarter, and occasionally catch a boundary the 20-F would have missed by years.

Resting everything on one filer is its own risk, so a second, independent class of evidence is reachable too: historical `sap.com` pages, read out of Common Crawl rather than from `sap.com` itself. `scripts/research/` holds the tooling for both corpora, and [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md) records which other candidate sources were tested and what each turned out to be worth — including the ones that failed.

[SCHEMA.md](SCHEMA.md) explains how the dating is anchored and what it does to the medians.

## Three kinds of transition

The heart of the project is a distinction the model project does not need:

- **`rename`** — a plain change of name with the product carrying on. The normal case, and the only category that feeds the median and the index.
- **`assimilation`** — absorption after an acquisition, typically prefixing the SAP name. Predictable, so it sits outside the statistics and gets its own metric instead: time to SAP-ification.
- **`generation`** — a technology or generation change rather than a rebrand. Hidden by default, available through a filter, never in the statistics.

Count all three together and bought-in families look artificially restless, while the index starts predicting renames for products that have long since done their compulsory round.

## What the index is not

The rename-pressure index measures what has already happened: how often a product has been renamed per year of its recorded history, and how far its current name has run against the length that product's names usually reach. It is not a probability, and SAP's plans are not an input, because we do not have them.

It is described on the site as semi-serious. The serious half is the arithmetic. The other half is the assumption that a company's naming habits are a stable physical constant.

The analysis page is also explicit about the four things the figures cannot see: names that have not ended yet and so cannot be measured, start dates that are systematically later than the truth, products that are not in the register at all, and families whose median rests on one or two renames.

## Out of scope

Discontinued products, logo history, renamed pricing models, SAP-internal project names.

**Names a product carried before SAP bought it.** The register documents renames *by SAP*. An acquired product's chain therefore starts at the acquisition, which is also where SAP's own filings start mentioning it — Concur existed for two decades before its first entry here. Every transition currently recorded happened while SAP already owned the product.

No imagery either: no SAP logos, no trademarks as graphics. Each product gets one emoji instead, which is the only branding decision this project is qualified to make.

## Layout of the repository

| Path | What it holds |
| --- | --- |
| `src/data/products.json` | the dataset, canonical |
| `src/validate.js`, `scripts/validate-data.js` | schema and consistency checks |
| `src/model.js` | every derived figure, shared by all three pages |
| `src/stats.js` | the medians, family figures and the index |
| `src/dates.js` | dates at mixed precision, without inventing days |
| `src/register.js`, `index.html` | the register page |
| `src/timeline.js`, `timeline.html` | the timeline page |
| `src/analysis.js`, `analysis.html` | the analysis page |
| `src/styles.css` | shared styles, one token set for all three pages |
| `scripts/research/` | tooling for the source corpora — SEC filings and Common Crawl |
| `tests/` | unit tests, run by `npm test` and in CI |

## Published site

The site is static and needs no build step, so GitHub Pages serves the repository as it stands. `.github/workflows/pages.yml` publishes to <https://tobias-run.github.io/sap-rebrand-registry/> on every push to `main`.

The deploy waits for `npm run validate` and `npm test`. A dataset the validator rejects fails the run rather than reaching the site, which is the same rule the rest of the project follows: no number goes public that has not been checked.

Only the three pages, `src/` and the two licence files are uploaded. `src/data/products.json` is served alongside them deliberately — the dataset is CC BY 4.0 and meant to be fetchable on its own.

## Considered, not decided

**Anonymous war stories.** Let people say what a rename actually cost them: the migration nobody budgeted for, the sales deck redone twice, the internal wiki that still uses the old name six years later. That is probably the part anyone would read first.

It needs a server, though, and right now there is none. Three static pages read one JSON file, and that is the whole architecture. Accepting text from strangers means storing it, moderating it, and dealing with spam, libel, and people who name their employer without thinking it through. Worth doing later. Not worth doing before the register is finished.

## Contributing

An entry is welcome when it comes with a source that resolves and states what the entry claims. `npm run validate` has to pass; CI runs it anyway. [SCHEMA.md](SCHEMA.md) lists the seventeen rules the validator enforces and, more usefully, the reasoning behind the ones that look arbitrary.

## Licence

Code under the [MIT licence](LICENSE). Dataset under [CC BY 4.0](LICENSE-DATA). Kept apart so the research stays reusable even for someone who has no use for the code.

## Legal

An independent research project with no connection to SAP. Product names and trademarks belong to SAP SE. No claim to completeness.

# SAP Rebrand Registry

An independent research project: how often, and when, SAP has renamed its products.

Two static pages, no server logic. A **register** listing every documented name period per product, and an **analysis** that computes median durations, family patterns and a semi-serious risk index from it. Every number is worked out in the browser from a single file. Nothing is carried forward by hand.

**Status:** under construction. The dataset has a sourced core — 10 products, 25 name periods, one primary source each, no warnings. The register page is up. The analysis page is not written yet.

```bash
npm start      # serves the register at http://localhost:3000
npm run validate
npm test
```

## Why

Microsoft has one: the [Microsoft Rebrand Registry](https://www.msrebrandregistry.com). SAP has nothing comparable — looked into and written up in [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md). The closest thing is Wikipedia's "List of SAP products", which mentions renames in passing, without dates and without individual sources.

This is a reimplementation, not a fork. [LICENSE-REVIEW.md](LICENSE-REVIEW.md) sets out why it has to be: the model project carries no licence, which means all rights reserved. What is taken from it is the concept and the definition of the metrics, neither of which is protectable. No code, no CSS, no text, no data.

## Evidence

Every name period cites at least one source. The precision of the source is preserved: where only a year is documented, a year is what you get, not an invented day. A qualifier records whether a date marks an announcement, a launch, the day something took effect, or merely the earliest point we can prove.

The load-bearing source for the current dataset is SAP's own Form 20-F filings with the SEC, unbroken since 1999. They are first-party, dated, and they stay online — `news.sap.com` has deleted its older articles, `sap.com` blocks automated requests, and the Wayback Machine throttles. Their limit is that they appear once a year, so they give upper bounds rather than exact rename dates. [SCHEMA.md](SCHEMA.md) explains how that is handled and what it does to the medians.

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
| `src/register.js`, `index.html`, `src/styles.css` | the register page |
| `tests/` | unit tests, run by `npm test` and in CI |

## Considered, not decided

**Anonymous war stories.** Collecting, per rename, the experience of the people who had to absorb it — the actual reason a register like this interests anyone. The catch is not the idea but what it costs. Today the project is two static pages over a single file, with no server and no state. Contributions from users need intake, storage, moderation and an answer to abuse and personal data. That is a decision of its own with a budget of its own, not a feature to bolt on, and it only makes sense once the register itself stands.

## Licence

Code under the [MIT licence](LICENSE). Dataset under [CC BY 4.0](LICENSE-DATA). Kept apart so the research stays reusable even for someone who has no use for the code.

## Legal

An independent research project with no connection to SAP. Product names and trademarks belong to SAP SE. No claim to completeness.

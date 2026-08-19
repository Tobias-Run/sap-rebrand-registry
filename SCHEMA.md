# Data schema

`src/data/products.json` is canonical. Everything else — durations, medians, family patterns, the index — is computed from it in the browser. There is no second copy of the data and no metric maintained by hand.

Checks run with `npm run validate`. The script runs in CI and fails on any error. Warnings are printed but do not block.

## Shape

```json
{
  "asOf": "2026-08-18",
  "sources": [ … ],
  "products": [ … ]
}
```

`asOf` is day-precise and required. Running name periods are measured against that date rather than the visitor's clock — otherwise no figure on the site would be reproducible.

## Product

| Field | Type | Required | Note |
| --- | --- | --- | --- |
| `id` | slug | yes | lowercase letters, digits, hyphens. Never changes, not even after a rename |
| `currentName` | string | yes | has to match the name of the running period |
| `emoji` | string | no | one or two emoji as a row marker. If absent, a warning |
| `family` | enum | yes | one of the seven families, see `src/constants.js` |
| `origin` | `organic` \| `acquired` | yes | |
| `acquiredFrom` | string | only with `acquired` | an error with `organic`, not merely redundant |
| `acquisitionDate` | date | only with `acquired` | must not fall after the first `assimilation` period |
| `succeeds` | product id | no | see "Products that run alongside their predecessor" below |
| `periods` | array | yes | chronological, at least one entry |

## Period

| Field | Type | Required | Note |
| --- | --- | --- | --- |
| `name` | string | yes | |
| `start` | date | yes | inclusive |
| `end` | date | all but one | exclusive. Exactly one period per product has no `end` |
| `qualifier` | `launch` \| `announcement` \| `effective` \| `by` | yes | `by` = earliest provable date; the real start may lie before it |
| `transition` | `rename` \| `assimilation` \| `generation` | all but the first | the kind of transition **into** this period |
| `revert` | boolean | no | see "Renaming back to an earlier name" below |
| `wave` | slug | no | see "Rename waves" below |
| `sources` | array of source ids | yes | at least one, each has to resolve |

## Source

| Field | Required | Note |
| --- | --- | --- |
| `id` | yes | unique |
| `title`, `publisher` | yes | |
| `url` | yes | has to start with `http://` or `https://` |
| `type` | yes | `first-party`, `archive`, `analyst`, `blog` |
| `published`, `retrieved` | no | date, where known |

`analyst` and `blog` rank below the rest. A period resting on those alone produces a warning, and the site marks such evidence visibly as well.

## An emoji instead of a logo

The site shows no SAP logos and no trademarks as graphics. That stays. An emoji per product is a different thing: a row marker that carries a long chain of names and makes a product findable in a long table. It stands for what the product does, never for the brand.

What counts is visible characters, not code points: `🗄️` and `🧑‍🏭` are one character each, even though a variation selector and a ZWJ sequence take several code points. Two characters is the limit.

## Dates

Permitted forms are `YYYY`, `YYYY-MM` and `YYYY-MM-DD`. The precision of the source is preserved: where only a year is documented, a year is what is stored. **A day is never invented** to make the table look even.

For comparison and arithmetic, a date is normalised to the first day of its precision — `2015` and `2015-01-01` mean the same instant. For display it is not: there, how precise an entry really is stays visible.

The validator checks the calendar too: `2015-02-29` is rejected, `2016-02-29` is not.

## How dates are anchored

The validator checks form, not truth. Truth rests on one rule, which has to hold while the data is gathered:

**Anchor to what the sourcing sentence itself claims.** Where the source names a date ("Released in 2019", "we have begun to sunset the SAP Cloud Platform brand in January 2021"), that date applies at its own precision, with `launch`, `announcement` or `effective`. Where it names none and only proves that a name was in use when it was published, the publication date applies with `qualifier: "by"`.

One known distortion follows from this: `by` dates sit systematically **later** than the real start. A rename in April shows up as "by" the year it was first documented. For medians that means name periods are measured too short rather than too long. That is the price of not inventing a date, and the reason `by` exists at all.

## Rules the validator enforces

1. `asOf` is present and day-precise.
2. Each product has **exactly one** running period, and it is the **last** one.
3. Periods leave no gaps and do not overlap: one period's `end` is character-for-character the next one's `start`.
4. No date falls after `asOf`.
5. An `end` falls after its `start`.
6. The **first** period has **no** `transition` — it is the starting state, and there is no transition into it. Every later period has one.
7. `assimilation` requires `origin: "acquired"`.
8. `acquisitionDate` does not fall after the first `assimilation` period.
9. `acquiredFrom` and `acquisitionDate` exist only with `origin: "acquired"`, and there they are required.
10. Every period cites at least one source that resolves.
11. Product and source ids are unique; product ids are slugs.
12. `currentName` matches the name of the running period.
13. Every enum field keeps to its value list.
14. `emoji`, where set, contains no letters or digits and at most two visible characters.
15. `revert: true` is only allowed on `transition: "rename"`, and only where an earlier period of the same product carries the same `name` — the return has to be to somewhere the chain has actually been.
16. `wave`, where set, is a slug.
17. `succeeds` has to resolve to another product's `id`, cannot point at the product's own `id`, and cannot form a cycle.

Warnings that do not block: a period without a primary source, a source no period references, a product without an emoji, periods that share a `wave` but not a `start` date.

## Why `transition` is the heart of it

- **`rename`** — a plain change of name with the product carrying on. The normal case, and the **only** category that feeds the median, family frequency and index.
- **`assimilation`** — absorption after an acquisition, typically prefixing the SAP name. Predictable in practice. Counting it would make bought-in families look artificially restless, and the index would predict renames for products that have long since done their compulsory round. It gets its own metric instead: time to SAP-ification, the gap between `acquisitionDate` and the first `assimilation` period.
- **`generation`** — a technology or generation change rather than a rebrand. Hidden by default, available through a filter, never in the statistics.

The model project simply excludes platform transformations. At SAP they are too frequent to ignore and too different in kind to count.

## Three questions the schema had left open, now decided

These were unsettled through step 5 on purpose — deciding them alone, before there was a real case to decide them against, would have meant guessing. Step 5 supplied the cases (SAP BTP's own history, the `2021-01` pair, SAP ERP standing next to a product this register doesn't even contain yet). The decisions below were made against that evidence, in step 6.

**Renaming back to an earlier name.** A revert counts as a rename like any other — it moved the name, and pretending otherwise would mean the median quietly depends on guessing SAP's intent behind a name change rather than just measuring it. What it gets instead is a marker: `revert: true` on the period, valid only when an earlier period of the same product carried that exact name. Nothing is excluded from the count; the flag exists so a returning name can be told apart from a genuinely new one when reading the chain, not to exempt it from the statistics.

There is no example of this in the current ten products — the case that prompted the question (repeated renaming in analytics) hasn't been researched into the dataset yet. The mechanism is ready for when it is.

**Rename waves.** Real, and already present: `sap-btp` and `sap-integration-suite` both carry `wave: "btp-2021"` on the period that starts `2021-01`, sourced to the same Form 20-F. The validator checks that periods sharing a `wave` also share a `start` — a warning, not an error, since a rollout spread over a few days is still one wave. Two tagged periods is not yet enough to justify an analysis-page section built around waves; the field exists so that section can be added later without a schema migration, and so the pattern is visible in the data now rather than only in prose.

**Predecessors that keep running.** SAP ERP still runs alongside SAP S/4HANA, which this register does not (yet) contain — adding it as a `generation` period of SAP ERP was never right, because that would assert SAP ERP had ended. The chosen model: a successor is its **own** product, linked to its predecessor by an optional `succeeds` field carrying the predecessor's `id`. Nothing about period contiguity changes — `succeeds` is resolved into `predecessor` and `successors` on each product at read time (see `model.js`), in both directions, so the dataset only has to say it once.

The alternative that was rejected — periods allowed to overlap — would have touched rule 2 and rule 3 above, and everything downstream that assumes a product's `currentPeriod` is unambiguous (both pages do). `succeeds` costs one field and one validation pass; overlapping periods would have cost a rewrite. SAP S/4HANA and SAP BW/4HANA are not yet in the dataset — the field is ready for when they are.

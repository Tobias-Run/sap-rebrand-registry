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
| `periods` | array | yes | chronological, at least one entry |

## Period

| Field | Type | Required | Note |
| --- | --- | --- | --- |
| `name` | string | yes | |
| `start` | date | yes | inclusive |
| `end` | date | all but one | exclusive. Exactly one period per product has no `end` |
| `qualifier` | `launch` \| `announcement` \| `effective` \| `by` | yes | `by` = earliest provable date; the real start may lie before it |
| `transition` | `rename` \| `assimilation` \| `generation` | all but the first | the kind of transition **into** this period |
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

Warnings that do not block: a period without a primary source, a source no period references, a product without an emoji.

## Why `transition` is the heart of it

- **`rename`** — a plain change of name with the product carrying on. The normal case, and the **only** category that feeds the median, family frequency and index.
- **`assimilation`** — absorption after an acquisition, typically prefixing the SAP name. Predictable in practice. Counting it would make bought-in families look artificially restless, and the index would predict renames for products that have long since done their compulsory round. It gets its own metric instead: time to SAP-ification, the gap between `acquisitionDate` and the first `assimilation` period.
- **`generation`** — a technology or generation change rather than a rebrand. Hidden by default, available through a filter, never in the statistics.

The model project simply excludes platform transformations. At SAP they are too frequent to ignore and too different in kind to count.

## Open decisions

Three points are deliberately unsettled, and none of them should be settled unilaterally:

**Renames back to an earlier name.** Does returning to a former name count as a new period or as a correction of the previous one? SAP has done it several times, particularly in analytics. The choice moves the medians noticeably. Both variants get computed against the finished dataset and put up for decision (step 6).

**Rename waves.** The schema has no field for several products being renamed together — January 2021, say, when the "SAP Cloud Platform" brand was dropped. An optional `wave` field at period level would carry a section on the analysis page that the model project cannot have: SAP does not rename products one at a time, it renames them in batches. Costs one field and one validation rule.

The first dataset already shows the pattern: `sap-btp` and `sap-integration-suite` both have a period starting `2021-01`, from the same source. Across ten products that is two — the wave is visible in the data, but not yet large enough to decide the question.

**Predecessors that keep running.** The dataset runs into a limit of the model: a chain of names implies that the old name ends when the new one begins. At SAP that is often untrue. SAP ERP is still maintained even though SAP S/4HANA has stood beside it since 2015; the same goes for SAP BW next to SAP BW/4HANA. Neither is recorded as a `generation` period of its predecessor, because that would assert the predecessor had ended.

That leaves the register without the very transition `generation` was meant for. The options: treat the successor as its own product (honest, but the connection is lost), extend the model to allow overlapping periods (expensive, and it touches every validation rule), or restrict `generation` to cases where the predecessor really does disappear (which is how it stands now — see `sap-erp`, SAP R/3 → mySAP ERP). To be decided with step 6.

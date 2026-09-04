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
| `family` | enum | yes | one of the six families, see `src/constants.js` |
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

No period carries `revert: true` yet. One candidate has been examined and rejected, which is worth recording because it shows the flag can be over-applied: "SAP Business Suite" runs through the annual reports from 2007 to 2016, disappears for eight years, and returns in the reports for 2024 and 2025. That looks like a textbook return to a former name until the two contexts are read side by side. The earlier one is the on-premise application bundle — "standardized core business processes", the thing SAP was "injecting in-memory computing into". The 2025 one is an umbrella over the cloud portfolio: "SAP Business Suite offers a comprehensive set of integrated solutions, in which applications, data, and AI work as one", with Cloud ERP as a named subset of it. Same words, different product — the same trap as the two unrelated products both called SAP Build, already noted in [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md). A revert has to be the same product returning to its own former name, not a name being reused.

**Rename waves.** Real, and larger than it first looked. The validator checks that periods sharing a `wave` also share a `start` — a warning, not an error, since a rollout spread over a few days is still one wave. Four waves are tagged so far:

| wave | products | what happened |
| --- | --- | --- |
| `mysap-drop-2007` | 5 | SAP dropped the `mySAP` prefix across the Business Suite: mySAP ERP, CRM, SCM, SRM and PLM all became SAP ERP, SAP CRM, SAP SCM, SAP SRM and SAP PLM |
| `businessobjects-drop-2012` | 1 | SAP dropped the `SAP BusinessObjects` brand "from all SAP offerings except for business intelligence", in its own words and with its own date. Only one product in it could be sourced product-by-product; see [COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md) |
| `c4hana-2018` | 2 | the SAP C/4HANA reorganisation renamed SAP Hybris Commerce and Gigya in one move, "with consistent naming" in SAP's own words |
| `btp-2021` | 2 | the SAP Cloud Platform brand was retired, taking SAP Cloud Platform Integration with it |

When the field was added, it carried two periods and the honest note was that this was too thin to build an analysis section on. The `mysap-drop-2007` wave changed that: five products renamed at one boundary, documented by two consecutive annual reports that list the same five suite members with and then without the prefix. That is the pattern the field was built for, and it is now large enough to carry a section of its own.

**Predecessors that keep running.** SAP ERP still runs alongside SAP S/4HANA — adding S/4HANA as a `generation` period of SAP ERP was never right, because that would assert SAP ERP had ended. The chosen model: a successor is its **own** product, linked to its predecessor by an optional `succeeds` field carrying the predecessor's `id`. Nothing about period contiguity changes — `succeeds` is resolved into `predecessor` and `successors` on each product at read time (see `model.js`), in both directions, so the dataset only has to say it once.

The alternative that was rejected — periods allowed to overlap — would have touched rule 2 and rule 3 above, and everything downstream that assumes a product's `currentPeriod` is unambiguous (both pages do). `succeeds` costs one field and one validation pass; overlapping periods would have cost a rewrite.

SAP S/4HANA is now in the dataset and carries `succeeds: "sap-erp"` — the first and so far only use of the field. It is a product with one name period and no rename at all, which is worth having for exactly that reason: SAP ERP's entry can say "later joined by SAP S/4HANA" without either product's chain of periods being bent to accommodate the other. SAP BW/4HANA is still missing.

## A family that was retired

The schema started with seven families. `industry-clouds` is gone, and the
reason is a finding rather than a tidy-up.

Two searches of the corpus went looking for a product to put in it and found
none. SAP's industry business appears in the filings as portfolios ("SAP for
Retail" and about twenty siblings, 2005 to 2020), as a strategy ("industry
cloud", launched in June 2020 as a portfolio), and as packages that are named
once and never again - SAP Billing for Telecommunications, SAP Reinsurance
Management, SAP Precision Retailing. None of those is a product with a chain of
names, which is the only thing this register records.

An empty family is not neutral. The register page showed a filter chip that
always returned nothing, and the analysis page carried a row reading "not
covered yet" beside six real ones. Both invited the reading that the research
was incomplete, when the actual finding is that SAP does not brand its industry
offerings the way it brands SAP CRM or SAP Datasphere.

The category is not wrong in principle, only unfilled by this evidence base.
Adding it back is three lines in `src/constants.js` if a case ever turns up -
most likely from a source class other than SEC filings, since product
documentation and price lists name things the annual reports never mention.
[COMPARABLE-PROJECTS.md](COMPARABLE-PROJECTS.md) has the full search.


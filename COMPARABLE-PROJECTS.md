# Comparable projects

**As of:** 18 August 2026
**Question:** does a project already exist that records SAP product renames the way we intend to?

**Answer:** no. There is no register with name periods, dated evidence and metrics computed from it. The niche is open.

## How this was researched, and where that falls short

The search was done entirely through web search. At the time, this environment's egress proxy blocked `sap.com`, `help.sap.com`, `news.sap.com`, `web.archive.org` and `btp.udina.de`, so with one exception none of those pages could be opened directly. The search index is US-centric, and a purely German-language or newly started project could have slipped past it. Treat the negative finding accordingly.

The exception: the UDINA Rebranding Guide was available as a text export and was read in full (see its own section below).

**Addendum, 18 August 2026 (step 5).** The network situation has changed: `news.sap.com` and `sec.gov` are reachable, `www.sap.com` and `help.sap.com` answer automated requests with 403, and `web.archive.org` throttles to the point of being unusable. The negative finding above was **not** re-checked and still dates from 18 August 2026. The new reachability is a reason to redo it at some point, not evidence that it still holds.

**Second addendum, same day.** Two of those blocks turned out to be walls with another door: historical `sap.com` pages are readable through Common Crawl, which is neither blocked nor throttled here. See "A survey of further sources" at the end of this file — that section records what nine candidate sources were each worth, including the ones that failed.

## What does exist

### 1. Inventories without a timeline

- [Wikipedia, "List of SAP products"](https://en.wikipedia.org/wiki/List_of_SAP_products) — the nearest neighbour. Renames turn up as subordinate clauses in running text ("SAP XI was renamed SAP PI from release 7.0"), with no date, no individual source and no periods.
- [HandWiki](https://handwiki.org/wiki/Software:List_of_SAP_products), [the Software Wiki on Fandom](https://software.fandom.com/wiki/List:SAP_products) — essentially Wikipedia offshoots.
- Product articles such as [SAP BTP](https://en.wikipedia.org/wiki/SAP_BTP) and [BusinessObjects](https://en.wikipedia.org/wiki/BusinessObjects) — usable single-product chronicles and a good place to start researching, but not a dataset.

**The bar:** Wikipedia is both our starting point and our measure. If an entry of ours proves no more than the corresponding Wikipedia paragraph, it has no reason to exist.

### 2. Cut-off tables for one area

[UDINA BTP, "Rebranding Guide"](https://btp.udina.de/service/sap/rebranding.html), UNIORG Cloud Services, © 2020–2026. Read in detail; see its own section below.

### 3. First-party notes, scattered

SAP documents renames only locally, where documentation or training material is affected:
- ["Explaining how the Recent Rebranding Displays in This Material", learning.sap.com](https://learning.sap.com/learning-journeys/developing-business-processes-with-sap-process-orchestration/explaining-how-the-recent-rebranding-displays-in-this-material_b38d8d87-cb88-4f89-abe8-c724049e8364)

Primary sources for us, not competing work.

**Correction, 18 August 2026.** This section also listed the page "Rebrandings" in the SAP Help Portal (NW 7.31). It was opened for the first time in step 5 and turns out to have nothing to do with product names: it covers redeclaring material in the oil and gas industry — "It is posible to rebrand product upon its return to the delivering plant." A hit on the word, not on the subject. Removed.

### 3a. SAP's own filings with the US securities regulator

Added in step 5 as a load-bearing class of source, and missed in the original research. SAP has filed a [Form 20-F](https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001000184&type=20-F) with the SEC every year since 1999. These reports describe the product portfolio in prose, name products, occasionally name the previous name alongside ("SAP Cloud Platform (formerly called SAP HANA Cloud Platform)"), and give acquisitions with the day the deal closed.

Why this beats a marketing page for our purposes:

- **first-party** — written and signed by SAP, not relayed by a third party
- **dated** — every statement carries the filing date, which is what makes `qualifier: "by"` worth anything
- **permanent** — sec.gov removes nothing. `news.sap.com` has deleted articles from before roughly 2021, `sap.com` blocks automated requests, `web.archive.org` throttles. An EDGAR URL will still resolve in five years
- **written under liability** — what it says, it says under securities law

The limit: the reports come out once a year. A rename in April is documented in the following year's report at the earliest, and then without a month. They give reliable upper bounds, not exact rename dates — see "How dates are anchored" in [SCHEMA.md](SCHEMA.md).

### 4. Occasional commentary

- [HackingSAP, "SAP BI product name shake-up: the 2017 edition"](https://www.hackingsap.com/blog/sap-bi-product-name-shake-up-the-2017-edition) — the title alone gives away that somebody started over several times and never turned it into a running register.
- ["SAP product naming confusion", SAP Community, 2011](https://blogs.sap.com/2011/01/10/sap-product-naming-confusion/)
- ["SAP BusinessObjects Product Name Change", SAP Community, 2010](https://blogs.sap.com/2010/09/10/sap-businessobjects-product-name-change/)

Snapshots with an expiry date. As evidence they fall under "blog" and rank below the rest, per section 7 of the brief.

### 5. GitHub

No dataset, no tracker, no awesome list on the subject.

### 6. The model project's own surroundings

The "Get Your Story Straight" network around the Microsoft Rebrand Registry — [mscloudlogos.com](https://www.mscloudlogos.com/), [letmecorrectthatforyou.com](https://www.letmecorrectthatforyou.com/), plus [m365maps.com/renames](https://m365maps.com/renames.htm) and rebrandedbyms.com — is Microsoft-only throughout. That matches the assumption in section 9 of the brief: no SAP equivalent of mscloudlogos.com exists.

## The UDINA Rebranding Guide in detail

The only find that comes close to a rename table. Read in full.

**What it is:** a snapshot of *one* event — the retirement of the "SAP Cloud Platform" brand, which the guide dates to **18 January 2021**. That day is the guide's claim, not an established fact; SAP's own pages from that week show a gradual de-branding rather than a switch (see below). Around 200 old→new rows in six sections: General, Integration and Extension Services, Third-Party Services, Environments and Runtimes, Editions, Add-Ons and Tools. Maintained by UNIORG Cloud Services as a reference for consulting work. It answers "what is this thing called today?", not "how often has it been renamed?".

**How it differs from us:**

| | UDINA Rebranding Guide | Our register |
| --- | --- | --- |
| Granularity | services, editions, SDKs, add-ons, price SKUs | products |
| Time | one cut-off date, no prior history, no continuation | full chains of names with periods |
| Evidence | a single source link in the entire table | at least one source per period, source precision preserved |
| Purpose | looking things up | analysis, median, risk index |
| Scope | SAP Cloud Platform / BTP | seven families |

The decisive difference: in the UDINA guide those ~200 rows are 200 entries. For us the same event is **one** transition per affected product (`transition: rename`, `qualifier: effective`, `start: 2021-01`). If we counted catalogue rows instead of product identities, Platform & Dev would end up with a median that buries every other family.

**Legal handling:** somebody else's work, © UNIORG Cloud Services, with no open licence. Used strictly as a search aid under section 7 of the brief; the table itself is not taken over. The facts in it evidently come from SAP's own rename list of January 2021 and were to be verified against that primary source once `sap.com` was reachable — which Common Crawl has since made possible, with a result that does not support the guide's headline date (see "18 January 2021 is not a clean cutover" below).

**Concrete leads taken from it:**

- 18 January 2021 as the cut-off for the mass rename from SAP Cloud Platform to SAP BTP
- SAP Cloud Platform Enterprise Messaging → SAP Event Mesh, 22 February 2021, sourced to an SAP blog — a straggler after the wave, so an entry of its own
- SAP Cloud Platform, SAP Data Hub service → SAP Data Intelligence service — a candidate for Data & Analytics
- The chain Portal → Launchpad service → Work Zone → Build Work Zone: visible in the site navigation, entirely absent from the table — a textbook case of what a cut-off table structurally cannot show

**Two traps:**

1. The guide lists "SAP Cloud Platform Build → SAP Build" (2021). That is *not* today's SAP Build (2022, grown out of AppGyver). Two different products with the same name, eleven years apart. To be verified; if it holds up, it is a test case for the rule that an `id` never changes.
2. Rows annotated "no longer available as a separate service; it is a capability within SAP Integration Suite" are discontinuations, not renames, and fall outside our scope under section 9. The same goes for every row marked "Retired."

## What sets us apart

The distinction is not the subject matter but three things none of the sources found here do:

1. dated precision with evidence for every period
2. the typing into `rename` / `assimilation` / `generation`
3. metrics computed rather than asserted

## Open points

The UDINA guide exposes a pattern the data model in section 3 did not originally capture: SAP does not rename products one at a time, it renames them in waves. Decided in step 6 - see "Three questions the schema had left open, now decided" in [SCHEMA.md](SCHEMA.md). `sap-btp` and `sap-integration-suite` already carry `wave: "btp-2021"`, sourced to the same filing this guide's own 18 January 2021 cut-off points at.

**18 January 2021 is not a clean cutover — and now there is evidence, not just an absence of it.** The day comes from the UDINA guide alone. The most that could be sourced first-hand was the month: "we have begun to sunset the SAP Cloud Platform brand in January 2021" (Form 20-F for 2020), so the dataset says `2021-01`.

Common Crawl let us look at what `sap.com` itself was doing that week, and the picture contradicts a single-day switch:

| capture (UTC) | page | `<title>` | "SAP Cloud Platform" | "SAP Business Technology Platform" |
| --- | --- | --- | --- | --- |
| 15 Jan 2021, 18:17 | `/products/business-technology-platform.html` | SAP Business Technology Platform | 0 | 10 |
| 18 Jan 2021, 18:17 | `/products/cloud-platform.html` | SAP Cloud Platform \| PaaS & App Development \| SAP | 31 | 1 |
| 27 Feb 2021, 13:48 | `/products/cloud-platform.html` | Cloud Platform \| PaaS and App Development \| SAP | 16 | 6 |

Three things follow. The BTP product page was already live on **15 January**, three days before the supposed cut-off. The Cloud Platform page was still fully branded **on 18 January itself**, hours into the day the guide names — its headline still read "Drive agility and change with SAP Cloud Platform". And the retirement is visible as a gradual de-branding rather than an event: by late February the same page had lost the "SAP" prefix from its own `<title>`, and mentions of the old name had halved while the new one climbed.

The single BTP mention on the 18 January page is the transition caught mid-step: "SAP Business Technology Platform" sits above "SAP Cloud Platform" as the parent label, exactly the brand-over-product relationship the Form 20-F describes.

So `2021-01` is not a fallback for a day we could not find. It is the more accurate claim, and SAP's own "begun to sunset" matches it better than any single date would.

**Why this is documented here and not cited in `products.json`.** A Common Crawl capture has no URL a reader can open. The index and data servers answer machine requests — a byte range inside a WARC file — and there is no viewer page to link to. Every source in the dataset was checked to resolve in a browser; adding one that cannot would trade a real property of the dataset for one more citation. Common Crawl earns its place as a way to *check* claims and *find* boundaries, not as a way to cite them.

**SAP BTP → "SAP Business AI Platform" is not a documented rename.** The claim to check was that the platform was renamed in 2026. What can be sourced first-hand does not support it:

- SAP's Sapphire announcement of 12 May 2026 says SAP Business AI Platform "unifies SAP Business Technology Platform, SAP Business Data Cloud and SAP Business AI into a single, governed environment" — three offerings brought together, not one product renamed.
- The Form 20-F filed on 26 February 2026 does not contain "Business AI Platform" **once**, while "SAP Business Technology Platform" appears six times.
- What is documented is the renaming of the **partner competency programme** (BTP competency → BAIP competency, effective 30 June 2026). A programme name is not a product name — the same confusion as the oil-and-gas page above, only more expensive.

`currentName` for `sap-btp` therefore stays "SAP Business Technology Platform". Worth checking again when the annual report for 2026 appears in February 2027, which will settle it.

## Using Wikipedia as a lead generator, not a source

Step 5 also went back to Wikipedia — not to cite it, but to find gaps in the dataset it could point at. The method: read the relevant Wikipedia article, then check every date it claims against SAP's own SEC filings before touching `products.json`. Nothing from Wikipedia ever went into a `sources` entry.

It paid off twice.

**SAP BTP was missing its actual first period.** Wikipedia's SAP BTP article names "SAP NetWeaver Cloud" as the platform's original name, unveiled 16 October 2012. That name does not appear anywhere in SAP's own filings, so it was not added. But chasing it down turned up something real: the Form 20-F for fiscal year 2012 calls the same offering "SAP HANA Cloud", a platform-as-a-service — a name distinct from "SAP HANA Cloud Platform", which only appears from the following year's filing. The dataset had started the chain one name too late. `sap-btp` now opens with "SAP HANA Cloud" (2013, by, Form 20-F for 2012) before "SAP HANA Cloud Platform" (2014).

**SAP SuccessFactors skipped a step.** Wikipedia mentions a transitional co-brand, "SuccessFactors, an SAP company", between the 2012 acquisition and the "SAP SuccessFactors" name. SAP's own filings confirm it with exact wording: the Form 20-F for fiscal year 2013 lists "SAP Cloud for Human Resources: Together with existing HR cloud solutions from SAP, SuccessFactors, an SAP company, offers..." — a name that is neither "SuccessFactors" nor "SAP SuccessFactors HCM Suite", the two periods the dataset had. It sits between them. Adding it also fixes a real distortion: time to SAP-ification for this product was computed as 47 months against the later name; the actual first prefixing event, "SuccessFactors, an SAP company", is documented by 2014, cutting that to 23 months.

Both corrections came from the same pattern: a periodical filing only proves a name was in use by the date it was published, so a name that shows up for one filing year and is gone by the next is easy to miss if you only check the years you already expect to find something in. `scripts/research/search-corpus.mjs` (see below) exists to make that check systematic instead of a matter of remembering to look.

## A reusable corpus, not a one-off search

`scripts/research/fetch-sec-filings.mjs` downloads and caches SAP's SEC filings as plain text (20-F annual reports and 6-K current reports, the ad hoc filings that land throughout the year rather than once each February). The cache lives outside the repository, under `.cache/`, and is rebuilt by running the script again — nothing about it needs to be committed for the research to be reproducible, only the two scripts that produce and search it.

`scripts/research/search-corpus.mjs "<term>"` then lists every cached filing mentioning that term, oldest first, with enough surrounding text to judge by eye. It exists because 6-K filings widen the dating precision the 20-F alone cannot give: they are filed as events happen rather than once a year, so a name documented only "by" a February annual-report date might be pinned down to the month, or the day, in a 6-K from months earlier. Their exhibits are not uniformly reliable, though - some are OCR-scanned investor decks with garbled text ("SuceesFactors", "Arbia"), and every hit still needs a human to read the context before it becomes a citation. The tool finds candidates; it does not decide anything on its own.

## A survey of further sources, and what each one turned out to be worth

Everything above rests on one door: SAP's filings with the SEC. That is a
single point of failure - if a convention of those filings has been misread,
the whole dataset tilts the same way, and no amount of internal consistency
would show it. So the next question was not "what else could we cite?" but
"what could contradict us?"

Nine candidates were tested. Each was probed for reachability first, then, if
reachable, checked against a case whose answer is already known - a source
that cannot reproduce something we have already established is not a source,
it is noise.

### Common Crawl - the significant find

**Works, validated, now tooled.** `sap.com` answers automated requests with
403 and the Wayback Machine throttles this environment to a standstill, so
SAP's own marketing pages looked permanently out of reach. Common Crawl holds
the same pages, crawled and dated, behind a different door: a CDX index
listing which captures exist, and a data server that serves the captured bytes
by byte range out of the WARC file they live in. Both halves work from here.

The validation: six `sap.com` pages captured in December 2017 were fetched and
read. All six say "SAP Cloud Platform". None says "SAP HANA Cloud Platform".
That is independent, dated confirmation, from SAP's own website, of a boundary
we had placed using only the 20-F - and it comes from outside the SEC entirely.

`scripts/research/common-crawl.mjs` does the listing and searching. Three
things about it are worth knowing before relying on it:

- **The index server rate-limits hard**; a handful of queries and it returns
  503 for a while. The data server does not. So the script caches every index
  response under `.cache/commoncrawl/` and is built to query the index rarely
  and fetch page bodies freely.
- **Coverage of `sap.com` varies wildly by crawl.** The December 2017 crawl has
  hundreds of pages; the February and April 2017 crawls have none at all. A
  missing capture proves nothing about the name in that month.
- **Most hits are the site's navigation menu, not prose.** SAP lists its
  product names in the global nav on every page, which is why a term appears on
  pages about Sybase agreements. As `by` evidence that is entirely legitimate -
  it is SAP stating on a date what the product is called - but it is a menu
  entry, not a sentence, and a citation should not imply otherwise.

### SEC full-text search - a second angle on a source we already use

**Works** (`efts.sec.gov`, with a real User-Agent, covering 2001 onward). It
searches every filer rather than only SAP, which is what makes it worth having
separately: it finds SAP product names in *other companies'* filings.
"SAP Hybris Commerce" turns up in a CallidusCloud filing from January 2018, for
instance. Third-party, but dated, permanent, and filed under the same
securities law as SAP's own. Useful mainly as corroboration - an outside firm
using a name is decent evidence the name was in the market.

### Wikidata - a lead generator, on the same footing as Wikipedia

**Works**, and lists 30 SAP products under "developer: SAP" (Q552581). But
inception dates are mostly missing, and the ones present are plainly rounded
(`2015-01-01` for SAP S/4HANA). Not citable, by the same rule that keeps
Wikipedia out of `sources`. Its value is breadth: it names products this
register does not have yet - SAP R/2, SAP Business One, SAP Business ByDesign,
SAP Fiori, SAP S/4HANA, SAP StreamWork - which is exactly the input the next
phase needs.

### Tested and rejected

- **npm registry** (`@sap/*`). Reachable, and publish timestamps are exact to
  the second. But the package descriptions never mention the platform names we
  track: searching every version of `@sap/cds`, `@sap/xsenv` and
  `@sap/approuter` for "Cloud Platform", "BTP" or "Business Technology"
  returned nothing at all. Precise dates attached to the wrong text.
- **Trademark registers** (USPTO, EUIPO). Both now require API keys for
  programmatic access, so unreachable here. Worth recording that they would be
  the *wrong* source even if open: a trademark filing dates when SAP decided it
  might want a name, which can be years before a product carries it. Using a
  filing date as a period start would systematically date renames too early -
  the mirror image of the `by` bias, and harder to spot.
- **GitHub API.** Not a network problem: this session's access is scoped to
  this repository, so SAP's org cannot be browsed. Left open for a session
  configured differently.
- **community.sap.com.** 403 to both `curl` and the fetch tool. SAP-authored
  posts there would rank as `blog` anyway, below the rest.
- **archive.today** and the **USPTO bulk data API**: no response from this
  environment at all.

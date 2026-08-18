# Licence review: the Microsoft Rebrand Registry as a model

**Subject:** `loryanstrant/Microsoft-Rebrand-Registry`
(https://github.com/loryanstrant/Microsoft-Rebrand-Registry, live at https://www.msrebrandregistry.com)
**Examined:** a clone of `main`, HEAD `f962112` ("Merge pull request 'Refine former-name header across pages' (#11)", 18 August 2026), full history (53 commits, first commit `68e521a` of 14 August 2026)
**Date of review:** 18 August 2026

---

## The finding in one sentence

**There is no licence — not in the repository, not in its history, not on the site.** All rights reserved therefore applies: forking and taking code are not covered. Under the decision tree in the brief this is case 3: **reimplementation**, no code taken.

---

## 1. Licence files in the repository root and in `.github/`

| Path checked | Finding |
| --- | --- |
| `LICENSE`, `LICENSE.md`, `LICENSE.txt` | absent |
| `COPYING`, `COPYING.md` | absent |
| `NOTICE`, `NOTICE.md` | absent |
| `COPYRIGHT` | absent |
| `.github/` (the whole directory) | **does not exist** — no `.github/LICENSE`, no `FUNDING.yml`, no templates |

Method: `find . -iname '*licen[cs]e*' -o -iname 'COPYING*' -o -iname 'NOTICE*' -o -iname 'COPYRIGHT*'` across the whole working tree, excluding `.git` — **no hits**.

The repository's complete file list, leaving aside the 60 logo files under `src/assets/logos/`, is exactly: `.gitignore`, `README.md`, `TECHNICAL.md`, `analysis.html`, `index.html`, `azure-static-web-apps.yml.example`, `package.json`, `staticwebapp.config.json`, `scripts/{package-deployment,validate-data}.js`, `src/{analysis,app,dates,former-site-names}.js`, `src/styles.css`, `src/data/products.json`, `src/assets/site-mark.svg`, `tests/{analysis,data}.test.js`. No licence file among them.

## 2. The `license` field in `package.json`

The file was read in full. Keys present: `name`, `version`, `private: true`, `type`, `scripts`, `engines`.

- **`license`: not set.**
- `"private": true` only prevents an accidental npm publish. It is **not** a statement about licensing, and certainly not a grant of rights.
- npm permits a missing `license` field when `private: true` is set, so its absence says nothing about the legal position beyond the fact that no rights were granted.

## 3. A licence section in `README.md` and `TECHNICAL.md`

Both files were read in full and additionally searched by regex
(`grep -niE 'licen[cs]e|copyright|\(c\)|©|all rights reserved|MIT|Apache|GPL|BSD|ISC'`).

- `README.md`: **no licence section.** Its headings are "Data methodology", "Analysis", "Contribute", "Technical documentation". The "Contribute" section invites contributions through the public repository **without** mentioning a licence, a CLA or any grant of rights. The two regex hits in `README.md` (lines 17 and 27) are the words "includes" and "labelled" in running text, about the scope of the data rather than the licence.
- `TECHNICAL.md`: **no licence section.** Its single regex hit (line 41) concerns "token-based manual releases" in the Azure deployment.
- Also checked and likewise carrying no licence statement: `.gitignore`, `staticwebapp.config.json`, `azure-static-web-apps.yml.example`.

## 4. Header comments in the source files

The first 12 lines of every source file were inspected individually, plus a full-text search across `src/`, `scripts/`, `tests/`, `index.html` and `analysis.html` for `licen[cs]e|copyright|©|(c) 20|rights reserved`: **no hits**.

| File | Begins with | Licence header |
| --- | --- | --- |
| `src/app.js` | `import { … } from './dates.js';` | no |
| `src/analysis.js` | `import { … } from './dates.js';` | no |
| `src/dates.js` | `export function parseDate(…)` | no |
| `src/former-site-names.js` | `export const FORMER_SITE_NAMES = [` | no |
| `src/styles.css` | `:root{--ink:#172033;…}` (minified, one line) | no |
| `scripts/validate-data.js` | `import { readFile } …` | no |
| `scripts/package-deployment.js` | `import { cp, mkdir, … } …` | no |
| `tests/*.test.js` | no header | no |
| `index.html`, `analysis.html` | `<!doctype html>` … `<head>` with no licence meta | no |

No SPDX identifier (`SPDX-License-Identifier`) anywhere.

## 5. Footer and legal notice on the live site

The live hosts are **unreachable from this environment** — both `https://www.msrebrandregistry.com` and the Azure host named in `TECHNICAL.md`, `https://wonderful-ocean-034ff8f1e.7.azurestaticapps.net`, are blocked by the egress proxy (`EGRESS_BLOCKED`). Instead the **shipped source** of both pages on `main` was checked; per `TECHNICAL.md` the repository is the deployment artefact unchanged (app location `/`, no build step).

Footer of `index.html` (lines 107–110), verbatim:

> Independent research project. Microsoft product names, logos and trademarks belong to Microsoft. No rebrands were harmed in the making of this registry.
> Contribute on GitHub · \<as-of date\>

The footer of `analysis.html` is word for word identical apart from "…in the making of this forecast."

Assessment: the footer settles **third-party trademarks (Microsoft's) and nothing else**. It carries **no** licence for the site's code, no copyright notice for the author, no legal notice and no link to terms of use. Neither page has a legal notice, and there are no further pages (`staticwebapp.config.json` holds only a navigation fallback).

*Left open:* the footer on the public domain could not be seen first-hand. If it differs from the repository, this needs revisiting — though given the identical deployment path a difference is unlikely.

## 6. Git history: removed or added later?

- `git log --all --diff-filter=ADMR --name-only` across all branches, filtered on `licen[cs]e|copying|notice|copyright`: **no hits**. A licence file was therefore **never** created, and so never removed either.
- The full list of every path ever committed (`git log --all --name-only`) was compared against the current tree: no deleted files apart from logo assets.
- Refs checked: `origin/main`, `origin/feat/table-timeline-poc`. No tags.
- `.github/` never appears anywhere in the history.

The missing licence is thus not an artefact of a truncated file list in the GitHub interface. It has been the actual state since the first commit.

**Corroboration:** the GitHub project page shows no licence entry in its "About" sidebar; the sidebar carries only the description "The source for a site that tracks Microsoft cloud product renames." GitHub's own licence detection finds nothing either. (The REST API at `api.github.com` is not reachable from this environment — HTTP 403 from the proxy.)

## 7. Licences of the dependencies

The project has **no** dependencies: `package.json` has no `dependencies`, `devDependencies` or `peerDependencies` at all. There is **no** lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` are all absent) and no `node_modules`.

Third-party software touched only while the npm scripts run:

| Package | Use | Licence | Relevance to us |
| --- | --- | --- | --- |
| `serve@14.2.4` | `npm start` calls `npx --yes serve@14.2.4 .` — a local development server, nothing more | **MIT** (per the npm registry metadata for 14.2.4) | applies independently; MIT lets us use it the same way without further ado |
| Node.js `node --test`, `node:fs/promises` | tests and scripts | Node's own licence (MIT-based) | uncritical, standard library |

No CDN, no external script, no external stylesheet: the only HTTP references in the HTML, JS and CSS are editorial links (mscloudlogos.com, letmecorrectthatforyou.com, m365maps.com, rebrandedbyms.com, and the GitHub repository). These dependency licences cover **only** the packages themselves — they say nothing about the model project's own code.

## 8. Fonts, icons and `site-mark.svg`

| Asset | Origin | Licence | Consequence for us |
| --- | --- | --- | --- |
| Fonts | no font files in the repository. The CSS uses system fonts only: `font-family:"Segoe UI",system-ui,-apple-system,sans-serif` and `font-family:Georgia,serif` | no licensing question, since no font files are shipped; "Segoe UI" is a Microsoft typeface and is used only where it happens to be installed | we ship no fonts either, but pick our own system-font stack without "Segoe UI" |
| Icon library | none (no Font Awesome or similar); the symbols are Unicode characters in the markup | — | uncritical |
| `src/assets/site-mark.svg` | the author's own hand-drawn SVG (a clock face with a question mark), 14 lines, no licence statement | **no licence → all rights reserved** | **do not take**, not even adapted. We need our own wordmark |
| `src/assets/logos/*` (60 files, SVG and PNG) | Microsoft product logos, per `README.md` from the "Microsoft Cloud Logos" collection (mscloudlogos.com) | Microsoft trademark law, no open licence | ruled out for us regardless — section 9 of the brief bars SAP logos outright |

---

## Assessment and consequence

Under section 2 of the brief the third branch of the decision tree applies: **no licence found, and the position is clear rather than merely uncertain.** Without a grant of rights, ordinary copyright governs, and reproducing, adapting and publishing the code is not permitted. That includes forking on GitHub: the fork button grants no licence, it presupposes one. GitHub's terms cover forking *within* GitHub, not reuse and independent publication.

**Cannot be taken:**

- any JavaScript from `src/` and `scripts/` — including individual functions such as `median()`, `parseDate()` or `monthDiff()` as they are actually written
- `src/styles.css` in full, including the colour palette and layout values as they are put together
- the HTML structure and class names of `index.html` and `analysis.html` as a whole
- all of the prose: headings, explanations, methodology notes, footer wording, the list in `former-site-names.js`
- `site-mark.svg`
- `products.json` as a database (database rights under § 87a of the German Copyright Act, which apply independently of copyright in the individual entries)

**Free to use, because not protectable:**

- the idea of an evidence-first rebrand registry with an analysis page
- the information architecture: two pages, a table with duration bars, alphabetical jump marks, filters
- the data model as a concept: a product with periods, start and end, a qualifier, source references — we write out the field names and schema ourselves
- the metrics and their definitions: median name duration, family frequency, number of former identities, a weighted risk index
- the weightings (45 / 35 / 20) as bare numbers
- the researched historical facts themselves (facts are not works); we are gathering them afresh for SAP from our own sources anyway

**How we proceed:** reimplementation, without looking at the other code while writing. The clone sits outside our project directory at `/workspace/loryanstrant/microsoft-rebrand-registry` and is not taken into our repository. The footer names the model as conceptual inspiration — an editorial reference rather than attribution required by any licence, and it must not be read as collaboration or endorsement.

---

## Appendix: draft enquiry to the author (GitHub issue)

To be sent to `loryanstrant/Microsoft-Rebrand-Registry` once approved. Work continues regardless; there is no need to wait for a reply.

**Title:** Question: which licence applies to this repository?

**Body:**

> Hi Loryan,
>
> The Rebrand Registry is a genuinely nice piece of work — the insistence on a cited source for every name period is what makes it more than a list.
>
> I'm building an equivalent site for SAP products (SAP has been at least as busy on this front, and the acquisitions add a category of their own). I'd like to be clear about the boundaries before I go further.
>
> I couldn't find a licence: no `LICENSE` file, no `license` field in `package.json`, and no licence section in the README or the technical guide, at any point in the repository's history. So I'm treating the code, CSS and copy as all rights reserved, and I'm writing my site from scratch rather than forking. My project takes the general idea — an evidence-first registry plus an analysis page with a semi-serious risk index — but no code, styling or wording from yours.
>
> Two questions:
>
> 1. Is the absence of a licence deliberate, or simply not gotten around to yet? If you ever add a permissive one, I'd be glad to know.
> 2. Would you be comfortable with my site crediting yours in the footer as the conceptual inspiration, with a link? Happy to word it however you prefer, or to leave it out entirely.
>
> Either answer is fine — I'd just rather ask than assume.
>
> Thanks,
> …

---

## Reproducing this

Every finding above comes from the local clone of `main` at `/workspace/loryanstrant/microsoft-rebrand-registry` (HEAD `f962112`) and from the GitHub project page. The two live hosts could not be fetched because of the egress block, which is noted at the relevant point above. To reproduce the core checks:

```bash
git clone https://github.com/loryanstrant/microsoft-rebrand-registry
cd microsoft-rebrand-registry
find . -path ./.git -prune -o -iname '*licen[cs]e*' -print -o -iname 'COPYING*' -print -o -iname 'NOTICE*' -print
grep -rniE 'licen[cs]e|copyright|©|rights reserved|SPDX' . --exclude-dir=.git
git log --all --diff-filter=ADMR --name-only --pretty=format:'%h %s' | grep -iE 'licen[cs]e|copying|notice'
```

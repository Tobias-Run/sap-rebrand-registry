# Why this project is a reimplementation

This register was inspired by the **Microsoft Rebrand Registry**
([`loryanstrant/Microsoft-Rebrand-Registry`](https://github.com/loryanstrant/Microsoft-Rebrand-Registry),
live at <https://www.msrebrandregistry.com>) — a nicely made site, and the
insistence on a cited source for every name period is what lifts it above a
list. Before writing any code here, its licensing was checked, because the
answer decides what may be reused and what has to be built from scratch.

This note records that check so anyone can see where this project's code came
from, and repeat the check for themselves.

**Examined:** a clone of `main`, HEAD `f962112`, 18 August 2026 — full history,
53 commits back to `68e521a` of 14 August 2026.

---

## The finding

**There is no licence — not in the repository, not anywhere in its history, not
on the site.** Ordinary copyright therefore applies and no rights are granted.

| Checked | Result |
| --- | --- |
| `LICENSE`, `COPYING`, `NOTICE`, `COPYRIGHT` in any spelling | absent |
| `.github/` directory | does not exist |
| `license` field in `package.json` | not set |
| Licence section in `README.md` or `TECHNICAL.md` | none |
| Licence or SPDX headers in any source file | none |
| Footer and legal notice on the pages | trademarks only, no licence |
| Git history, all branches, for an added or removed licence file | no hits |
| GitHub's own licence detection | finds nothing |

Two details worth stating plainly, because both are easy to misread:

- `"private": true` in `package.json` only prevents an accidental npm publish.
  It is not a licence statement and grants nothing.
- The site footer settles **Microsoft's** trademarks and nothing else. It
  carries no licence for the site's own code and no copyright notice.

The absence is not an artefact of a truncated file listing: a licence file was
never committed, so it was never removed either. This is the state the
repository has been in since its first commit.

## What follows from it

Without a grant of rights, reproducing, adapting and publishing that code is
not permitted. That includes forking: the fork button presupposes a licence
rather than granting one, and GitHub's terms cover forking *within* GitHub, not
independent republication.

**Not taken, and not to be taken:**

- any JavaScript, as actually written — including small functions like
  `median()` or `parseDate()`
- the stylesheet, including the palette and layout values as put together
- the HTML structure and class names of the pages
- all prose: headings, methodology notes, footer wording
- the site mark
- `products.json` as a database (database rights apply independently of
  copyright in the individual entries)

**Free to use, because not protectable:**

- the idea of an evidence-first rebrand registry with an analysis page
- the information architecture — a table with duration bars, filters, jump marks
- the data model as a concept: a product with periods, a start, an end, a
  qualifier, source references. The field names and schema here are written out
  independently, and have since diverged considerably
- the metrics as definitions: median name duration, family frequency, a
  weighted risk index
- the historical facts themselves. Facts are not works, and the SAP data here
  was gathered from its own sources regardless

**How this project proceeded:** reimplementation, written without the other
code open. The Microsoft registry is named as conceptual inspiration — an
editorial credit, not an attribution any licence requires, and not to be read
as collaboration or endorsement.

*If a licence is ever added there, this note is out of date and the position
should be checked again.*

## Dependencies and assets

This project has no runtime dependencies, ships no fonts, no icon library and
no images — the one visual mark per product is an emoji. `npm start` invokes
`serve` (MIT) as a local development server; nothing else third-party is
touched. SAP logos and trademarks are excluded here as a matter of policy,
independent of any licensing question.

## Reproducing the check

```bash
git clone https://github.com/loryanstrant/microsoft-rebrand-registry
cd microsoft-rebrand-registry
find . -path ./.git -prune -o -iname '*licen[cs]e*' -print -o -iname 'COPYING*' -print -o -iname 'NOTICE*' -print
grep -rniE 'licen[cs]e|copyright|©|rights reserved|SPDX' . --exclude-dir=.git
git log --all --diff-filter=ADMR --name-only --pretty=format:'%h %s' | grep -iE 'licen[cs]e|copying|notice'
```

# Page-image verification gate

Mandatory quality guard so invented or drifted digest text cannot reach Local Top 5, Coastal Katte Top 5, or Firebase publish.

**Ground rule:** Treat PageDigest JSON/Markdown as *untrusted* until headlines (and, for Top 5 picks, the cited story) are confirmed on the **printed page image** via vision (Read tool on page PDF/PNG, or rendered page from the source edition PDF). Never confirm from model memory, prior runs, or blurbs alone.

## High-risk editions

| Risk | Why | Required handling |
|:-----|:----|:------------------|
| **News Trail** and other **image-only** / scan-heavy PDFs | Text layer missing or poor; extractors/editors hallucinate easily | Every verification step must use **vision on the page image** (Read the page file). No OCR-only shortcuts unless OCR output is checked against the image. |
| Multi-paper days | Same story duplicated with different errors | Verify **per cited `paper` + `page`**, not “close enough” across papers. |

## Gate A — After each paper’s PageDigest (before “paper done”)

**When:** Assembly produced valid `*_PageDigest.md` + `*_PageDigest.json`, **before** deleting `pages/` (see deferral below).

**What to check:** For a **sample of pages** (minimum: page 1, the highest article-count page, and any page an editor/extractor struggled on) — or **every page** when cheap (≤6 pages, or News Trail / image-only) — for each checked page:

1. Open the page source: `$WORKDIR/pages/page-NN.pdf` (or PNG if that is what was used) with the **Read** tool.
2. For **every article record on that page** in the digest JSON (match `page` + `index`), confirm the **digest `headline` appears on the image** (allow minor OCR spacing/punctuation; **not** a different story, name, or event).
3. If any headline on a checked page fails: **fix the digest from the image** (re-transcribe that article), re-validate, then continue. Do **not** mark the paper done or run cleanup until Gate A passes for the chosen sample (or all pages).

Record in run notes (chat or internal): paper slug, pages checked, pass/fail. Fail = stop the pipeline for that paper.

## Gate B — Before merge/deploy (Top 5 citations)

**When:** `LocalTop5_*.json` exists and, if publishing Coastal Katte, `CoastalKatte_Top5_*.json` exists — **after** ranking drafts, **before** commit/push/merge to `main`.

**Scope:** Every item that will ship in Top 5:

- **Local Top 5:** all ranked items in all six buckets (`items[]` / equivalent in frozen schema).
- **Coastal Katte Top 5:** all five ranked items (each must trace to Local Top 5 `sources`).

For **each** selected item, for **each** entry in `sources` (or the single source):

1. Resolve `paper`, `page`, and `headline` (and rank blurb if Coastal Katte copied it).
2. Open the **actual page image** for that paper and page number:
   - Prefer `$WORKDIR/pages/page-NN.pdf` if still present under `work/<date>/<Paper_Slug>/`.
   - Else **Read** the user’s **source combined PDF** at that page (or re-run `split_pdf.py` into a temp dir — do not commit temps).
3. Confirm the **cited headline** (or unmistakable same story lead) is visible on that page. If the story is wrong page, wrong paper, or invented: **drop or replace** the item from the Top 5 JSON/Markdown and re-rank if needed.
4. **Hard fail:** If any remaining Top 5 item still fails page-image check, **stop the pipeline** — do not commit, merge, or deploy. Report which `paper` / `page` / `rank` failed.

Gate B is **not** optional and **not** waivable for “thin news days.”

## Defer per-paper cleanup in the combined pipeline

`newspaper-page-digest` normally deletes `pages/` after Gate A. When this paper is digested as **step 1 of `daily-local-coastal-top5`** (or the Project daily playbook):

- Run **Gate A** per paper, then **keep** `pages/` (only that subfolder) until **Gate B** passes for the whole date.
- After Gate B passes, run digest **Step 5 cleanup** for each paper folder (remove `pages/`, `transcripts/`, `edited/`, temps) so only `*_PageDigest.*` remain before commit.

If Gate B fails, fix digests or Top 5 selections, re-run Gate B; do not publish.

## What “pass” means

| Pass | Fail |
|:-----|:-----|
| Headline text (or unambiguous substring) visible on the cited page | Headline absent, different story, wrong person/place/event, or page empty/ad-only |
| Blurb facts for Top 5 match **visible** body text on that page for that story | Blurb adds figures/names/outcomes not on the page |

When in doubt, fail and re-read the page image.

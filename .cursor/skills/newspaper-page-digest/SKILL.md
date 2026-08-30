---
name: newspaper-page-digest
description: Splits any combined multi-page newspaper PDF into individual pages and produces a page-by-page Markdown digest — a faithful heading and a short 1-3 sentence blurb for every single article on every page, not just one summary per page. Uses a fan-out of sub-agents (a page-reader per page, then a news-editor per page). Use when the user uploads a combined newspaper PDF and asks to "digest it page by page", "extract every article per page", "give me headline + blurb for each story", "process this newspaper page by page", or names this skill directly.
---

# Newspaper Page Digest

Turn any combined, multi-page newspaper PDF into one Markdown file where every page lists every one of its articles as a faithful heading plus a short factual blurb. Paper-agnostic — works on whatever newspaper PDF is provided.

Read `references/output-spec.md` before writing the final file — exact template, heading/blurb rules, include vs skip, and the `scope` field.

## Why the sub-agent fan-out

A single pass over a 10–20 page combined newspaper PDF tends to skim later pages or blur separate articles together. One sub-agent per page to extract, then one per page to write heading+blurb, keeps each job small. That costs more tool calls; the trade-off is required because the user wants per-article fidelity on every page.

If the PDF is 4 pages or fewer, skip the fan-out and extract directly. For a typical combined edition (8+ pages), use the fan-out below.

## Hard lessons (do not regress)

These failed in real runs — treat as mandatory:

1. **Never attach PDFs to Task `file_attachments`.** That API only accepts `image/*` or `video/*`. PDF attachments error immediately. Tell each sub-agent to use the **Read tool** on the absolute page PDF path.
2. **Demand the full body back.** Sub-agents often reply with a high-level summary (“9 articles transcribed”) and omit the transcript/sentinels. Every extractor/editor prompt must say: return the **complete** structured text in the reply — not a count, not a summary. If the reply is truncated or summary-only, **resume** that agent once with “return the full text now”.
3. **Pass the full extractor transcript into the editor.** Do not compress to headline lists. Thin prompts caused invented names/facts (wrong CM, wrong scam). Paste the extractor’s Headline/Body/Section blocks verbatim.
4. **Persist intermediates to disk (during the run only).** After each successful extractor, write `$WORKDIR/transcripts/page-NN.md`. After each editor, write `$WORKDIR/edited/page-NN.md`. If a Task UI reply is thin, re-read the file or resume; do not re-invent from memory. After both final digests are written and validated, delete all intermediates (Step 5) so `$WORKDIR` keeps only the two `*_PageDigest` files.
5. **Parent owns assembly.** Validate article counts page-by-page against the transcript. Fix wrong blurbs yourself from the transcript when an editor drifts. Write both digest files from verified records.
6. **Skip front-page teasers.** Lines that are only a headline + `SEE P N` with no body are navigation, not articles — the full piece lives on the jump page. Do not emit teaser-only records on the cover.
7. **Write digests only under `work/<DD-Mon-YYYY>/<Paper_Slug>/`.** Never next to the source PDF in Downloads (or elsewhere), never in the project root, never under `Daily_top/`. Paper slug = masthead with spaces → underscores (`The_Hindu`, `News_Trail`).
8. **Cleanup is mandatory.** After validation, delete `pages/`, `transcripts/`, `edited/`, `tmp/`, PNGs, OCR text. Leaving intermediates behind is a failed run.
9. **JSON schema is frozen.** `*_PageDigest.json` must match `references/output-spec.md` exactly — same top-level keys, same article field names/types/order of meaning. Do not rename keys, add ad-hoc fields, or drop `scope`. Downstream `daily-local-top` depends on this shape.
10. **Scope geography carefully.** Kerala / other-state South pages are `india` (or that state's story), not `coastal_karnataka`. Coastal = Dakshina Kannada / Udupi / coastal belt outside Mangaluru city only. Mis-tags pollute Daily Top 5.
11. **Fidelity over flourish (user relies on this).** Never invent facts, names, figures, dates, causes, or outcomes. Never add unrelated wording, metaphors, or “helpful” context that is not in the printed article. Downstream Top 5 and Coastal Katte scripts treat digests as ground truth — a wrong blurb poisons the channel.
12. **Do not drop load-bearing facts.** In transcripts, capture the full body. In blurbs (still 1–3 sentences), keep every critical fact the article states for that story: ₹ amounts, percentages, deadlines/dates, places, officials’ names when they are the news, court/action outcomes. Prefer a dense accurate blurb over a punchy incomplete one. If the editor omits a key figure present in the transcript, the parent must fix it before writing the digest.

## Work folder layout

All outputs for a calendar day live under one date folder. Each paper gets its own subfolder; the daily aggregate uses `Daily_top`:

```
work/<DD-Mon-YYYY>/
  The_Hindu/          # this paper's digests (+ temp pages/transcripts/edited during the run)
  News_Trail/
  <Any_Other_Paper>/
  Daily_top/          # LocalTop5 from the daily-local-top skill (not created by this skill)
```

- **Date folder:** `DD-Mon-YYYY` from the paper's printed date (e.g. `30-Aug-2026`).
- **Paper folder:** masthead name with spaces → underscores (e.g. `The Hindu` → `The_Hindu`, `News Trail` → `News_Trail`). If unknown at start, use a short slug from the PDF filename and rename to the masthead name once page 1 is read.
- Never write digests next to the source PDF or into `Daily_top/`.

## Step 1 — Locate the PDF and split it into pages

1. Find the newspaper PDF (workspace, uploads, or a path the user gave).
2. Resolve date + paper folder, then the bundled splitter (personal skill install first, then project `.cursor`):
   ```bash
   SCRIPT="${HOME}/.cursor/skills/newspaper-page-digest/scripts/split_pdf.py"
   if [ ! -f "$SCRIPT" ]; then
     SCRIPT=".cursor/skills/newspaper-page-digest/scripts/split_pdf.py"
   fi
   pip install pypdf --break-system-packages 2>/dev/null
   DATE_SLUG="30-Aug-2026"          # from masthead / filename
   PAPER_SLUG="The_Hindu"           # spaces → underscores
   WORKDIR="<workspace>/work/${DATE_SLUG}/${PAPER_SLUG}"
   mkdir -p "$WORKDIR/pages" "$WORKDIR/transcripts" "$WORKDIR/edited"
   python3 "$SCRIPT" <input.pdf> "$WORKDIR/pages"
   ```
   The script prints JSON with `total_pages` and each page path. Keep that report — it drives every later step.
3. If the script fails, fall back to reading the original combined PDF with the Read tool, one page at a time, in every step below.

## Step 2 — Extractor sub-agent per page

For each page, spawn one Task (`subagent_type`: `page-extractor` if available, else `generalPurpose`). Job: read that one page and transcribe faithfully. Run in parallel batches of 4–6.

**Do not** pass the PDF via `file_attachments`. Prompt each extractor with:

> Use the Read tool on the single-page PDF at `<absolute page path>`. This is page `<N>` of a newspaper. Transcribe every distinct article: (a) exact printed headline, (b) full body text as printed — do not omit rupee figures, dates, percentages, names, places, or outcomes, (c) byline/section label if present. List every article separately, in page order. Do not summarize yet — transcribe what's printed. Do not invent or "clean up" wording that isn't on the page. Ignore ads, masthead, page numbers, pure photo-credit captions, and cover teasers that are only "SEE P N" with no body. Report as a structured list: one block per article with Headline / Body / Section (if labeled). Tag output with Page `<N>`. CRITICAL: Your reply MUST contain the FULL transcription text for every article — never only a count or high-level summary.

After each extractor returns, write the full reply to `$WORKDIR/transcripts/page-NN.md`. If the reply lacks full bodies, resume once demanding the complete transcript. Collect outputs tagged by page number.

## Step 3 — News-editor sub-agent per page

For each page's extractor output, spawn a second Task (`subagent_type`: `news-editor` if available, else `generalPurpose`). Run in parallel batches of 4–6.

Prompt each editor with:

> You are an expert news editor writing quick news-in-shorts entries. Below is the raw transcription of every article on page `<N>`. For EVERY distinct article (not just the lead), produce one delimited record:
>
> `<!-- npd:article page="<N>" index="<i>" kind="news|opinion" scope="<scope>" -->`
> then `###` headline matching the printed headline,
> then a 1–3 sentence blurb (who, what, why it matters — ONLY facts in the transcription; keep all load-bearing ₹ figures, dates, percentages, places, and named actors),
> then `<!-- /npd:article -->`.
>
> Separate records with a blank line, `---`, blank line. No outside knowledge, no speculation, no invented wording, no unrelated metaphors. If a fact is not in the transcription, it must not appear in the blurb. Prefer a dense accurate blurb over a punchy incomplete one. If the transcription lists 5 articles, return 5 wrapped records. Skip only items with no real news content (ads, pure photo credits, SEE P N teasers).
>
> **scope** (required, exactly one value — most specific that fits):
> - `mangaluru` — Mangaluru city
> - `coastal_karnataka` — Dakshina Kannada / Udupi / coastal belt outside Mangaluru city
> - `karnataka` — Karnataka state (incl. Bengaluru, Mysuru, statewide politics)
> - `india` — national India news
> - `international` — world / foreign news
> - `sports` — sports (any geography)
> - `lifestyle` — wellness, architecture, features without a hard news geo angle
> - `other` — does not fit above
>
> Prefer geography over topic when both apply (e.g. a Mangaluru match → `mangaluru`, not `sports`). Use `sports` only when the story has no stronger local/state/national/world geo hook, or is pure sports roundup.
>
> CRITICAL: Return ONLY the sentinel-wrapped records in your reply — full text, no preamble, no “all N articles formatted” summary.
>
> Transcription:
> `<full extractor output for this page>`

After each editor returns, write `$WORKDIR/edited/page-NN.md`. If the reply is summary-only or missing records, resume once. Spot-check blurbs against the transcript; correct invented facts yourself.

## Step 4 — Assemble Markdown + JSON

Follow `references/output-spec.md` exactly for structure, filenames, sentinels, `scope`, and heading/blurb rules. Concatenate every page's editor output in page order, compute summary counts, and write **both** files into `$WORKDIR`:

- `$WORKDIR/*_PageDigest.md` — human-readable, articles wrapped in `<!-- npd:article ... -->` / `<!-- /npd:article -->` with `---` between them (`scope` on the opening tag)
- `$WORKDIR/*_PageDigest.json` — same records as a JSON object (canonical for Python), each article including `"scope"`

**Do not** write digests next to the source PDF, into the project root, under `Daily_top/`, or under `$WORKDIR/pages/`. Final digests live only in that paper's folder under `work/<date>/`.

Optional helper: after assembly, run `scripts/parse_digest.py` on the JSON to confirm article count and that every record has `scope`.

## Step 5 — Cleanup intermediates

**Only after** both `*_PageDigest.md` and `*_PageDigest.json` exist in `$WORKDIR` and have been validated (counts/scopes look right), delete everything else under that edition folder. Keep **only** those two digest files.

Remove:

- `$WORKDIR/pages/` (split page PDFs and any rendered PNGs)
- `$WORKDIR/transcripts/`
- `$WORKDIR/edited/`
- `$WORKDIR/tmp/` (or any similar temp dirs)
- Loose OCR dumps, renders, and other scratch files in `$WORKDIR` (e.g. `*-ocr.txt`, `*-render*.png`, `page-*-1.png`)

Do **not** delete the source newspaper PDF the user provided. Do **not** delete the two digest files. During extraction/editing, intermediates are still required — cleanup is a final step only.

Example:

```bash
# After digests are written and validated:
find "$WORKDIR" -mindepth 1 -maxdepth 1 ! -name '*_PageDigest.md' ! -name '*_PageDigest.json' -exec rm -rf {} +
```

## Step 6 — Deliver

Do not paste the entire digest into the chat. Give a short 2–3 line summary (pages processed, total articles, anything unusual such as a page that was mostly ads) and point the user at both file paths under `$WORKDIR`.

## Quality Checklist Before Delivering

- Every page from the split report appears in the output, in order.
- Every article the extractor found has a corresponding sentinel-wrapped record **and** a JSON object — spot-check a couple of pages if anything looks thin.
- No page collapsed multiple articles into a single blurb.
- No cover teaser-only (`SEE P N`) records.
- No `---` or npd sentinels inside a blurb.
- No blurb contains a fact that isn't traceable to the article's own text.
- No blurb invents wording or drops load-bearing ₹ figures / dates / names / outcomes that the transcript stated.
- Spot-check at least one multi-figure story (infra, courts, crime) against the transcript before cleanup.
- Every article has a valid `scope` in both Markdown sentinels and JSON.
- Filenames, sentinels, and JSON shape follow `references/output-spec.md`.
- After cleanup, `$WORKDIR` contains **only** the two `*_PageDigest` files (no `pages/`, `transcripts/`, `edited/`, temp PNGs, or OCR text).

---
name: digest-newspaper
description: Digest a combined newspaper PDF page by page into one Markdown file with a heading and short blurb for every article.
---

# Digest newspaper

The user wants a page-by-page newspaper digest. Follow the `newspaper-page-digest` skill exactly (workspace `.cursor/skills/newspaper-page-digest/SKILL.md` or `~/.cursor/skills/newspaper-page-digest/SKILL.md`) and `references/output-spec.md`.

1. Load the skill and output-spec.
2. Locate the newspaper PDF the user attached or named.
3. Resolve `work/<DD-Mon-YYYY>/<Paper_Slug>/` (e.g. `work/30-Aug-2026/The_Hindu/`). Split with `scripts/split_pdf.py`; create `pages`, `transcripts`, and `edited` dirs under that paper folder.
4. Fan out extractor then editor sub-agents per page (skip fan-out only if 4 pages or fewer). Prefer agents `page-extractor` and `news-editor`.
5. **Critical run rules** (from past failures — see skill “Hard lessons”):
   - Never pass PDFs via Task `file_attachments` (images/videos only). Tell agents to **Read** the absolute page path.
   - Demand **full** transcript / sentinel text in every agent reply; resume once if you get a summary-only reply.
   - Persist each page transcript and edited page under the paper folder.
   - Pass the **full** extractor text into each editor (not headline lists).
   - Skip cover teasers that are only `SEE P N`.
   - Every article needs `scope` on the sentinel and in JSON (`mangaluru` | `coastal_karnataka` | `karnataka` | `india` | `international` | `sports` | `lifestyle` | `other`).
   - **Fidelity:** no invented facts/wording; blurbs must keep load-bearing ₹ figures, dates, names, and outcomes from the transcript.
6. Write both digest files into that paper folder only (`*_PageDigest.md` + `*_PageDigest.json`) — never next to the source PDF, never into `Daily_top/`.
7. After both digests are validated, delete all intermediates under that paper folder (`pages/`, `transcripts/`, `edited/`, `tmp/`, PNGs, OCR text). Keep **only** the two `*_PageDigest` files. Return a short summary plus both paths — do not paste the full digest into chat.

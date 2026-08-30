# Lessons from real digest runs

Captured so the skill does not regress. Full rules live in `../SKILL.md` (“Hard lessons”).

## What broke on News Trail Mangaluru 30 Aug 2026 (12 pages)

| Failure | Cause | Fix now in skill |
|:--------|:------|:-----------------|
| Extractors errored immediately | Task `file_attachments` rejected `application/pdf` | Never attach PDFs; instruct Read on absolute path |
| Some extractors returned “9 articles transcribed” only | Subagent UI summarises long replies | Prompt demands FULL text; resume once; write transcripts during run |
| Editors invented wrong names/facts | Parent passed condensed headline lists | Pass full Headline/Body/Section transcript |
| Editors returned “all formatted above” with empty body | Same summary habit | Demand ONLY sentinel records in reply; persist `edited/` during run |
| Cover had teaser-only records | `SEE P N` treated as articles | Skip teasers; digest jump page only |
| Parent had to hand-assemble | Thin editor replies | Parent validates counts and owns final MD/JSON |

## What broke / was corrected on The Hindu Mangaluru 30 Aug 2026 (20 pages) + layout work

| Failure | Cause | Fix now in skill |
|:--------|:------|:-----------------|
| Digests landed in `Downloads/` next to the PDF | Output-spec said “next to the PDF (or workspace)” | Always `work/<DD-Mon-YYYY>/<Paper_Slug>/` only |
| Intermediates left behind (`pages/`, `transcripts/`, PNGs, OCR) | No cleanup step | After validated digests, delete everything except the two `*_PageDigest` files |
| Flat edition folders (`th-mangalore-…`, `mangaluru-…`) | Early slug design | Date folder first, then paper folders + `Daily_top/` |
| Kerala South stories tagged `coastal_karnataka` | Editors treated “South” page as coastal | Scope by geography: coastal = DK/Udupi belt only; Kerala/other states → `india` |
| Daily Top polluted by mis-scopes | Trusted `scope` blindly | daily-local-top must drop obvious wrong-bucket candidates when ranking |

## Tools that matter

- **Shell + `scripts/split_pdf.py`** — page list drives fan-out
- **Task** with `page-extractor` / `news-editor` — parallel per page (batches of 4–6)
- **Read** — only reliable way for subagents to open page PDFs
- **Write** — persist transcripts/edited pages during the run; final digests only after assembly
- **`scripts/parse_digest.py`** — validate sentinels / `scope` after assembly
- **Cleanup** — `find "$WORKDIR" … ! -name '*_PageDigest.*' -exec rm -rf {} +`

## `scope` field (v1.3)

Required on every article in Markdown sentinel and JSON. Values: `mangaluru`, `coastal_karnataka`, `karnataka`, `india`, `international`, `sports`, `lifestyle`, `other`. Prefer most specific geography.

## Fidelity (v1.4+)

Across digest → LocalTop5 → Coastal Katte Top5 → script:

- Never invent facts, names, figures, dates, causes, or unrelated wording.
- Never drop load-bearing ₹ / % / dates / places / key names / outcomes from source material when writing blurbs or scripts.
- Dense accurate short form beats punchy incomplete short form.
- Scripts may simplify language but not invent stakes the source doesn’t support.
- Final script hybrid must have zero `[UNVERIFIED]` flags.

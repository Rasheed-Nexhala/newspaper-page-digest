---
name: daily-local-top
description: >-
  Aggregates all newspaper PageDigest JSON files for a given day, filters
  Mangaluru / coastal Karnataka / Karnataka articles, and produces Top 5 lists
  for each. Writes both Markdown and JSON under work/<date>/Daily_top/. Use when
  the user asks for "top local news", "top Mangaluru / Karnataka / coastal
  news", "daily local top", "combine today's digests", or names this skill.
---

# Daily Local Top

After one or more newspapers for a day have been digested (`*_PageDigest.json`), build a single daily brief of the **Top 5** stories in each local bucket:

| Bucket | `scope` value |
|:-------|:--------------|
| Mangaluru | `mangaluru` |
| Coastal Karnataka | `coastal_karnataka` |
| Karnataka | `karnataka` |

Read `references/output-spec.md` before writing the final files. **JSON shape is frozen** — always match that spec.

## Hard lessons (do not regress)

1. **Layout:** Read digests from `work/<DD-Mon-YYYY>/<Paper_Slug>/`, write only to `work/<DD-Mon-YYYY>/Daily_top/`. Never invent a parallel `work/daily/` tree or write into paper folders.
2. **Trust `scope`, but correct clear mis-tags when ranking.** If a candidate is tagged `coastal_karnataka` but the story is plainly Kerala / Tamil Nadu / other-state (e.g. Malappuram MDMA, Thiruvananthapuram politics), **do not** put it in Coastal Top 5 — skip it for that bucket (still leave the source digest unchanged). Same for soft commercial fillers crowding out civic news.
3. **Dedupe across papers.** Same DIG transfer / same Nagendra resignation in Hindu + News Trail = one ranked item with multiple `sources`. Prefer the fuller factual blurb.
4. **Stable JSON.** `LocalTop5_*.json` must always use the exact keys in `references/output-spec.md`. Do not rename `date_slug`, `papers_scanned`, `buckets`, `candidate_count`, `selected_count`, `items`, `rank`, or `sources`. Consumers depend on this.
5. **Delete scratch.** Remove `candidates.json` after finals are written. `Daily_top/` should end with only the two `LocalTop5_*` files (unless the user asks to keep scratch).

## Work folder layout

```
work/<DD-Mon-YYYY>/
  The_Hindu/           # per-paper digests
  News_Trail/
  <Any_Other_Paper>/
  Daily_top/           # this skill writes here
    LocalTop5_<DD-Mon-YYYY>.md
    LocalTop5_<DD-Mon-YYYY>.json
```

## Step 1 — Resolve the date

1. Use the date the user names, or infer from open digests / folders under `work/`.
2. Normalize to `DD-Mon-YYYY` (e.g. `30-Aug-2026`).
3. Create: `work/<DD-Mon-YYYY>/Daily_top/`.

## Step 2 — Collect candidates

1. Find every `*_PageDigest.json` under `work/<DD-Mon-YYYY>/`, **excluding** `Daily_top/`.
2. Prefer the helper script:

```bash
SCRIPT=".cursor/skills/daily-local-top/scripts/collect_local_candidates.py"
if [ ! -f "$SCRIPT" ]; then
  SCRIPT="${HOME}/.cursor/skills/daily-local-top/scripts/collect_local_candidates.py"
fi
python3 "$SCRIPT" --work "<workspace>/work" --date "30-Aug-2026" \
  --out "work/30-Aug-2026/Daily_top/candidates.json"
```

The script writes candidates grouped by `mangaluru` / `coastal_karnataka` / `karnataka`, each item carrying `paper`, `edition`, `page`, `index`, `headline`, `blurb`, `kind`, `scope`.

If the script is unavailable, load each paper folder's digest JSON manually. Input digests must already use the frozen PageDigest JSON schema (`paper`, `edition`, `date`, `articles[].scope`, …).

## Step 3 — Rank Top 5 per bucket

For each of the three scopes independently:

1. **Deduplicate** near-identical stories across papers (same event / same principal actors). Keep one entry; note all source papers in `sources`. Prefer the fuller, more factual blurb.
2. **Drop clear mis-scopes** for this bucket (see Hard lessons #2) before ranking.
3. **Rank by news value** for a Mangaluru / coastal / state reader — not by paper brand. Signals (highest first):
   - Civic / public-impact weight (governance, safety, infrastructure, courts, major appointments)
   - Prominence (earlier page, lower `index` on that page)
   - Cross-paper presence (same story in 2+ digests)
   - Recency / actionability (decisions, deadlines, new facts — not soft fillers)
4. Skip pure lifestyle fillers, routine notices, bank/mall openings, and opinion unless clearly the day's lead local story.
5. **Fidelity:** Do **not** invent facts. Headlines/blurbs must come from the digest records. When merging cross-paper duplicates, keep the fuller factual blurb — never rewrite with new claims or unrelated wording. Do not drop ₹ figures, dates, or named outcomes present in the chosen source blurb.
6. Take at most **5**. If fewer than 5 unique eligible stories exist, take all and note the shortfall in the summary.

## Step 4 — Write both outputs

Into `work/<DD-Mon-YYYY>/Daily_top/` only:

- `LocalTop5_<DD-Mon-YYYY>.md`
- `LocalTop5_<DD-Mon-YYYY>.json`

Follow `references/output-spec.md` exactly (frozen JSON). Do **not** overwrite paper folders.

Delete `candidates.json` after the finals are written.

## Step 5 — Deliver

Short summary only: date, which papers were scanned, counts per bucket (candidates → selected), paths to both files. Do not paste the full brief into chat.

## Quality checklist

- Only eligible `mangaluru` / `coastal_karnataka` / `karnataka` stories after mis-scope filter.
- Each bucket has ≤ 5 items; ranks are 1–N consecutive.
- Duplicate cross-paper stories appear once, with `sources` listing papers.
- Every selected item is traceable to a digest article.
- Both MD and JSON agree on ranks, headlines, and blurbs.
- JSON keys match the frozen schema in `references/output-spec.md`.
- Outputs live under `work/<date>/Daily_top/` only; folder ends with the two LocalTop5 files.

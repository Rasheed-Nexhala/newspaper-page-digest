# Output Format — Daily Local Top 5

## Location

```
work/<DD-Mon-YYYY>/
  The_Hindu/
  News_Trail/
  <Any_Other_Paper>/
  Daily_top/
    LocalTop5_<DD-Mon-YYYY>.md
    LocalTop5_<DD-Mon-YYYY>.json
```

Example: `work/30-Aug-2026/Daily_top/LocalTop5_30-Aug-2026.json`

Per-paper digests stay in sibling folders (`The_Hindu/`, `News_Trail/`, …). This skill only writes under `Daily_top/`.

## Buckets (fixed order)

1. `mangaluru` — Top 5 Mangaluru
2. `coastal_karnataka` — Top 5 Coastal Karnataka
3. `karnataka` — Top 5 Karnataka

## Markdown template

```markdown
# Local Top 5 — <DD Mon YYYY>
**Date:** <Day, DD Month YYYY>  |  **Papers scanned:** <Paper1; Paper2; …>

---

## Top 5 — Mangaluru

### 1. [Headline]
[1–3 sentence blurb from digest(s)]
_Sources: The Hindu Mangaluru p.5; News Trail Mangaluru p.3_

### 2. …

---

## Top 5 — Coastal Karnataka

### 1. …

---

## Top 5 — Karnataka

### 1. …

---

## Summary
- Papers scanned: …
- Mangaluru candidates → selected: N → M
- Coastal Karnataka candidates → selected: N → M
- Karnataka candidates → selected: N → M
```

If a bucket has zero candidates: under that heading write `*(no local stories in today's digests)*`.

## JSON shape (**schema frozen** — do not change keys)

UTF-8, 2-space indent. Always emit these exact keys so parsers stay compatible across days.

**Required top-level:** `date`, `date_slug`, `papers_scanned`, `buckets`.

**Required `papers_scanned[]`:** `paper`, `edition`, `path` (optional but preferred: `total_articles`).

**Required `buckets` keys (always all three):** `mangaluru`, `coastal_karnataka`, `karnataka`.

**Required per bucket:** `label`, `candidate_count`, `selected_count`, `items`.

**Required per item:** `rank`, `headline`, `blurb`, `kind`, `scope`, `sources`.

**Required per source:** `paper`, `edition`, `page`, `index`.

Do not rename, nest differently, or omit empty buckets — use `"items": []` when none selected.

```json
{
  "date": "Sunday, 30 August 2026",
  "date_slug": "30-Aug-2026",
  "papers_scanned": [
    {"paper": "The Hindu", "edition": "Mangaluru", "path": "work/30-Aug-2026/The_Hindu/TheHindu_..._PageDigest.json", "total_articles": 0}
  ],
  "buckets": {
    "mangaluru": {
      "label": "Top 5 — Mangaluru",
      "candidate_count": 0,
      "selected_count": 0,
      "items": [
        {
          "rank": 1,
          "headline": "",
          "blurb": "",
          "kind": "news",
          "scope": "mangaluru",
          "sources": [
            {"paper": "The Hindu", "edition": "Mangaluru", "page": 5, "index": 1}
          ]
        }
      ]
    },
    "coastal_karnataka": {
      "label": "Top 5 — Coastal Karnataka",
      "candidate_count": 0,
      "selected_count": 0,
      "items": []
    },
    "karnataka": {
      "label": "Top 5 — Karnataka",
      "candidate_count": 0,
      "selected_count": 0,
      "items": []
    }
  }
}
```

- `items` ordered by `rank` ascending (1 = top).
- `selected_count` equals `len(items)` and is at most 5.
- MD and JSON must match for the same `rank` + bucket.

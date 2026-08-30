# Output Format — Coastal Katte Top 5

## Location

```
work/<DD-Mon-YYYY>/Coastal_Katte/
  CoastalKatte_Top5_<DD-Mon-YYYY>.md
  CoastalKatte_Top5_<DD-Mon-YYYY>.json
```

## Markdown template

```markdown
# Coastal Katte Top 5 — <DD Mon YYYY>
**Date:** <Day, DD Month YYYY>  |  **Source:** LocalTop5_<DD-Mon-YYYY>.json  |  **Channel:** @coastal_katte

---

### 1. [Headline]
[blurb from LocalTop5]

_Scope: mangaluru_ · _Sources: …_  
_Why Coastal Katte: …_

### 2. …

---

## Summary
- Candidates considered: N (from LocalTop5)
- Selected: M
- Buckets represented: …
```

## JSON shape (**schema frozen** — do not change keys)

UTF-8, 2-space indent. Always emit these exact keys.

**Required top-level:** `date`, `date_slug`, `channel`, `source_local_top5`, `candidate_count`, `selected_count`, `items`.

**Required per item:** `rank`, `headline`, `blurb`, `kind`, `scope`, `source_bucket`, `local_top_rank`, `sources`, `why_channel`.

**Required per source:** `paper`, `edition`, `page`, `index`.

```json
{
  "date": "Sunday, 30 August 2026",
  "date_slug": "30-Aug-2026",
  "channel": "coastal_katte",
  "source_local_top5": "work/30-Aug-2026/Daily_top/LocalTop5_30-Aug-2026.json",
  "candidate_count": 15,
  "selected_count": 5,
  "items": [
    {
      "rank": 1,
      "headline": "",
      "blurb": "",
      "kind": "news",
      "scope": "mangaluru",
      "source_bucket": "mangaluru",
      "local_top_rank": 1,
      "sources": [
        {"paper": "The Hindu", "edition": "Mangaluru", "page": 5, "index": 1}
      ],
      "why_channel": "Infra / civic hook with local daily-life impact."
    }
  ]
}
```

- `items` ordered by `rank` 1…N (N ≤ 5).
- `source_bucket` is which LocalTop5 bucket the item came from (`mangaluru` | `coastal_karnataka` | `karnataka`).
- `local_top_rank` is that item's rank inside that bucket.
- MD and JSON must match.

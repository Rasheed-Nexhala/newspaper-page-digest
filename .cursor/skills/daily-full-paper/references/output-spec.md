# Output Format — Daily Full Paper

Complete-day reader. Separate from Local Top 5. Do not write into `Daily_top/`, paper folders, or Coastal Katte.

## Location

```
work/<DD-Mon-YYYY>/
  The_Hindu/
  News_Trail/
  <Any_Other_Paper>/
  Daily_top/                 # LocalTop5 — do not touch
  Full_paper/
    FullPaper_<DD-Mon-YYYY>.md
    FullPaper_<DD-Mon-YYYY>.json
```

Example: `work/31-Aug-2026/Full_paper/FullPaper_31-Aug-2026.json`

## Sections (fixed order)

1. **Complete news** — hard news grouped by digest `scope` (including `lifestyle` and `other`). Duplicate events across papers are one cluster.
2. **Technology** — primarily science / IT / space / digital / gadgets / AI / telecom stories. **Top 5 first**, then remaining tech items. Tech stories are **not** repeated under Complete news.
3. **Opinion & Explainers** — unsigned editorials, signed op-eds (`kind: opinion`), newspaper FAQ/Q&A boxes, and long fact/explainer pieces. One list. These are **not** repeated under Complete news or Technology.

## Per-item writing (news and technology)

```markdown
### [Headline]

**In short:** [1–2 sentences]

[One short paragraph — clear, not a wall of text]

**What this is**
- **Concept:** [what kind of thing this is]
- **Told:** [what the article reports]
- **Purpose:** [what the piece is for, as the article states it]

**Important points**
- [load-bearing fact]
- [load-bearing fact]
```

## Per-item writing (opinion & explainers)

```markdown
### [Headline]

**In short:** [1–2 sentences]

- [one part of the argument or FAQ]
- [next part]
```

No long paragraphs in this section. Fidelity: every fact traces to digest blurbs (or the printed article). No invented figures, names, motives, or “what this means.”

## Markdown template

```markdown
# Full Paper — <DD Mon YYYY>
**Date:** <Day, DD Month YYYY>  |  **Papers scanned:** <Paper1; Paper2; …>

---

## Complete news

### Mangaluru

#### [Headline]
**In short:** …
[paragraph]
**What this is**
- **Concept:** …
- **Told:** …
- **Purpose:** …
**Important points**
- …
_Sources: The Hindu Mangaluru p.6; Deccan Herald Mangalore p.2_

---

### Coastal Karnataka
…

### Karnataka
…

### India
…

### International
…

### Sports
…

### Lifestyle
…

### Other
…

---

## Technology

### Top 5 — Technology

#### 1. [Headline]
…same news card as above…

### More technology

#### [Headline]
…

---

## Opinion & Explainers

### [Headline]
**In short:** …
- …
_Sources: …_

---

## Summary
- Papers scanned: …
- Source articles → clusters: N → M
- Complete news (by bucket): …
- Technology candidates → top 5 / rest: …
- Opinion & Explainers: …
```

Empty bucket: `*(no stories in today's digests)*`.

## JSON shape (**schema frozen**)

UTF-8, 2-space indent. Always emit these exact keys.

**Required top-level:** `date`, `date_slug`, `papers_scanned`, `summary`, `sections`.

**Required `papers_scanned[]`:** `paper`, `edition`, `path` (optional: `total_articles`).

**Required `summary`:** `source_articles`, `clusters`, `news_count`, `technology_candidate_count`, `technology_top5_count`, `technology_rest_count`, `opinion_count`.

**Required `sections` keys (always, this order):** `news`, `technology`, `opinion`.

**Required `sections.news`:** `label`, `buckets` with keys `mangaluru`, `coastal_karnataka`, `karnataka`, `india`, `international`, `sports`, `lifestyle`, `other`. Each bucket: `label`, `item_count`, `items`.

**Required `sections.technology`:** `label`, `top5` (`label`, `candidate_count`, `selected_count`, `items`), `rest` (`label`, `item_count`, `items`).

**Required `sections.opinion`:** `label`, `item_count`, `items`.

**Required news/technology item keys:** `headline`, `gist`, `paragraph`, `what_this_is` (`concept`, `told`, `purpose`), `important_points` (array of strings), `kind`, `scope`, `sources`. Technology top-5 items also include `rank` (1–N).

**Required opinion item keys:** `headline`, `gist`, `points` (array of strings), `kind`, `scope`, `sources`.

**Required per source:** `paper`, `edition`, `page`, `index`.

Do not rename keys. Empty lists stay `[]`. MD and JSON must match.

```json
{
  "date": "Monday, 31 August 2026",
  "date_slug": "31-Aug-2026",
  "papers_scanned": [
    {"paper": "The Hindu", "edition": "Mangaluru", "path": "work/31-Aug-2026/The_Hindu/….json", "total_articles": 0}
  ],
  "summary": {
    "source_articles": 0,
    "clusters": 0,
    "news_count": 0,
    "technology_candidate_count": 0,
    "technology_top5_count": 0,
    "technology_rest_count": 0,
    "opinion_count": 0
  },
  "sections": {
    "news": {
      "label": "Complete news",
      "buckets": {
        "mangaluru": {"label": "Mangaluru", "item_count": 0, "items": []},
        "coastal_karnataka": {"label": "Coastal Karnataka", "item_count": 0, "items": []},
        "karnataka": {"label": "Karnataka", "item_count": 0, "items": []},
        "india": {"label": "India", "item_count": 0, "items": []},
        "international": {"label": "International", "item_count": 0, "items": []},
        "sports": {"label": "Sports", "item_count": 0, "items": []},
        "lifestyle": {"label": "Lifestyle", "item_count": 0, "items": []},
        "other": {"label": "Other", "item_count": 0, "items": []}
      }
    },
    "technology": {
      "label": "Technology",
      "top5": {
        "label": "Top 5 — Technology",
        "candidate_count": 0,
        "selected_count": 0,
        "items": []
      },
      "rest": {
        "label": "More technology",
        "item_count": 0,
        "items": []
      }
    },
    "opinion": {
      "label": "Opinion & Explainers",
      "item_count": 0,
      "items": []
    }
  }
}
```

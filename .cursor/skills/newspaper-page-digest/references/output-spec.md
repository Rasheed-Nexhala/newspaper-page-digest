# Output Format Specification — Newspaper Page Digest

## Filenames and location

Layout (date → paper → digests):

```
work/<DD-Mon-YYYY>/<Paper_Slug>/
  <PaperName>_<Edition>_<DD-Mon-YYYY>_PageDigest.md
  <PaperName>_<Edition>_<DD-Mon-YYYY>_PageDigest.json
```

Examples:

- `work/30-Aug-2026/The_Hindu/TheHindu_Mangaluru_30-Aug-2026_PageDigest.json`
- `work/30-Aug-2026/News_Trail/NewsTrail_Mangaluru_30-Aug-2026_PageDigest.json`

`<Paper_Slug>` is the masthead paper name with spaces replaced by underscores (`The_Hindu`, `News_Trail`, `Deccan_Herald`). Derive `<PaperName>` and `<Edition>` from page 1 masthead (e.g. `TheHindu_Mangaluru`, `NewsTrail_Mangaluru`). If the masthead can't be identified, fall back to the uploaded file's base name.

After both digests are written and validated, delete all other contents of that paper folder (`pages/`, `transcripts/`, `edited/`, temp dirs, PNGs, OCR text). The paper folder must end with **only** those two digest files. Do not delete the user's original newspaper PDF. Do not write into `work/<date>/Daily_top/` (that folder is for the daily-local-top skill).

## Article record (required in both files)

Each article is one record with:

| Field | Meaning |
|:------|:--------|
| `page` | 1-based page number |
| `index` | 1-based order of this article on that page |
| `headline` | Printed headline, verbatim or near-verbatim |
| `blurb` | 1–3 sentence factual paraphrase |
| `kind` | `"news"` or `"opinion"` (op-eds/editorials) |
| `scope` | Geographic / content bucket (see below) |

### `scope` values (exactly one)

Pick the **most specific** that fits:

| Value | Use when |
|:------|:---------|
| `mangaluru` | Story is primarily about Mangaluru city |
| `coastal_karnataka` | Dakshina Kannada, Udupi, or coastal belt outside Mangaluru city (Puttur, Moodbidri, Ujire, Dharmasthala, etc.) |
| `karnataka` | Karnataka state — Bengaluru, Mysuru, statewide politics, state govt |
| `india` | National India news (other states, Centre, national institutions) |
| `international` | World / foreign news |
| `sports` | Sports stories when there is no stronger local/state/national/world geo hook, or pure sports roundups |
| `lifestyle` | Wellness, architecture, features without a hard news geo angle |
| `other` | Does not fit above |

Prefer geography over topic when both apply (a Mangaluru swimming meet → `mangaluru`, not `sports`). Karnataka / India politics → `karnataka` / `india`, not a separate politics bucket.

## Markdown — visual + machine delimiters

Every article is wrapped in unique HTML-comment sentinels. Those comments are the **only** supported split points for a parser. Do not put `<!-- npd:article` or `<!-- /npd:article -->` anywhere else.

Between articles, use a blank line, then a horizontal rule `---`, then a blank line. Pages are separated the same way.

### Complete Markdown template

```markdown
# [Paper Name] — [Edition] — Page-by-Page Digest
**Date:** [Day, DD Month YYYY]  |  **Total pages:** [N]  |  **Total articles:** [N]

---

## Page 1

<!-- npd:article page="1" index="1" kind="news" scope="india" -->
### [Exact headline as printed]

[1–3 sentence factual blurb — who/what/when/where/why, straight from the article's own paragraph text. No added interpretation.]
<!-- /npd:article -->

---

<!-- npd:article page="1" index="2" kind="news" scope="international" -->
### [Exact headline as printed]

[1–3 sentence factual blurb]
<!-- /npd:article -->

---

## Page 2

<!-- npd:article page="2" index="1" kind="opinion" scope="international" -->
### [Exact headline as printed] (Opinion)

[1–3 sentence factual blurb]
<!-- /npd:article -->

---

## Page 3

*(no reportable articles)*

---

## Summary
- Pages processed: [N]
- Articles extracted: [N]
- Pages with no reportable articles (full-page ads, notices only): [list page numbers, or "none"]
```

### Sentinel rules (strict — parsers depend on this)

Opening tag, on its own line:

```
<!-- npd:article page="<N>" index="<N>" kind="news|opinion" scope="<scope>" -->
```

Closing tag, on its own line, immediately after the blurb (no extra article text after it):

```
<!-- /npd:article -->
```

- `page` and `index` are integers in quotes.
- `kind` is exactly `news` or `opinion`.
- `scope` is exactly one of: `mangaluru`, `coastal_karnataka`, `karnataka`, `india`, `international`, `sports`, `lifestyle`, `other`.
- The line after the opening tag is `### ` + headline. Nothing else on that line.
- The blurb is one or more paragraphs between the headline and the closing tag. No `---` inside a blurb.
- One article = one open tag + one `###` headline + blurb + one close tag. Never nest records.
- Empty pages: `## Page N` then `*(no reportable articles)*` and **no** article sentinels.

## JSON sidecar (canonical for Python — **schema frozen**)

Same records as the Markdown, as a single object. UTF-8, 2-space indent.

**Do not change this shape across runs.** Downstream skills (`daily-local-top`) and any parsers expect these exact keys. No renamed fields, no extra top-level keys, no omitted required fields.

```json
{
  "paper": "[Paper Name]",
  "edition": "[Edition]",
  "date": "[Day, DD Month YYYY]",
  "total_pages": 0,
  "total_articles": 0,
  "pages_with_no_articles": [],
  "articles": [
    {
      "page": 1,
      "index": 1,
      "kind": "news",
      "scope": "india",
      "headline": "[Exact headline as printed]",
      "blurb": "[1–3 sentence factual blurb]"
    }
  ]
}
```

**Required top-level keys (always):** `paper`, `edition`, `date`, `total_pages`, `total_articles`, `pages_with_no_articles`, `articles`.

**Required article keys (always, this order preferred):** `page`, `index`, `kind`, `scope`, `headline`, `blurb`.

- `articles` is in page order, then `index` order.
- `pages_with_no_articles` is an array of page numbers, or `[]`.
- `headline` / `blurb` / `kind` / `scope` must match the Markdown record for the same `page`+`index`.
- Load with `json.load`. To parse Markdown instead, use `scripts/parse_digest.py`.

## Rules for Headings

- Use the article's own printed headline, verbatim or near-verbatim (trim only line-wrap artifacts). Never invent a punchier headline.
- If a headline is split across a jump/continuation (`Contd. on P4`), use the headline as printed where the story starts; do not duplicate the same story as a second entry on the jump page unless it has materially new content there.
- Front-page **teasers** that are only a headline plus `SEE P N` (no body) are not articles — skip them; digest the full piece on the jump page.

## Rules for Descriptions

- 1–3 sentences. Never more than 3.
- Every fact must trace back to the article's own paragraph text — no outside knowledge, no inference beyond what's stated, no speculation about causes or outcomes the article doesn't state.
- **No invented or unrelated wording.** Do not add colour, analogies, motives, or “what this means” that the article does not state. The user must be able to rely on the blurb as a faithful short form of the print story.
- **Do not drop load-bearing facts** present in the article: rupee amounts, percentages, deadlines/dates, locations, key named people/institutions, and the main action or outcome. Pack them into the 1–3 sentences; never omit a figure or date just to sound cleaner.
- Cover the core of the story: who, what, and why it matters *as the article states it*, in the fewest words that stay accurate.
- Paraphrase; don't just copy the first sentence of the article verbatim unless that sentence already is the gist — but paraphrasing must not change meaning or introduce new words for facts.
- No reporter bylines, no "read more" pointers, no dateline boilerplate in the blurb itself.

## What Counts as an Article (include)

- Any distinct news item, feature, opinion piece, obituary, or notable photo-with-caption that reports an actual event or fact.
- Editorials and op-eds — include, append `(Opinion)` after the heading, and set `kind` to `"opinion"`.
- Sports, entertainment, business briefs — include like any other article.

## What to Skip (exclude)

- Full-page or partial advertisements.
- Masthead, page number, RNI/registration lines, weather boxes with no narrative content.
- Standalone decorative elements (puzzles, horoscopes) unless the user's paper treats them as content worth noting — default to skipping.
- Pure photo captions with no story value (e.g. a photographer credit line with no accompanying news).
- Cover teasers with no body (`SEE P N` only).

## Multi-Article Pages

A page with 4 distinct stories must produce 4 separate sentinel-wrapped records (and 4 JSON objects) — never collapse them into one paragraph, and never summarize only the lead story.

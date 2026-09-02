---
name: daily-full-paper
description: >-
  Aggregates all newspaper PageDigest JSON files for a given day into a complete
  Full Paper reader: clustered news by scope, a Technology Top 5 plus remaining
  tech stories, and one Opinion & Explainers section. Writes Markdown and JSON
  under work/<date>/Full_paper/. Use when the user asks for the "full paper",
  "complete newspaper", "all articles", "editorials and FAQs", "technology top 5",
  or names this skill.
---

# Daily Full Paper

After one or more newspapers for a day have been digested (`*_PageDigest.json`), build a **complete-day reader** that is **not** Local Top 5. The user should be able to go through every story without missing items that did not make a Top 5.

Read `references/output-spec.md` before writing. **JSON shape is frozen.**

## Hard lessons (do not regress)

1. **Separate product.** Write only under `work/<DD-Mon-YYYY>/Full_paper/`. Never merge into `LocalTop5_*.json`, paper `*_PageDigest.json`, or Coastal Katte files. PageDigest `kind` stays `news|opinion` only — classify FAQ/explainers/tech **here**.
2. **Trust `scope` for Complete news buckets**, but send primarily tech/science/digital stories to Technology, and send editorials/op-eds/FAQ/explainers to Opinion & Explainers. Do not list the same cluster in two sections.
3. **Dedupe across papers.** Same event in Hindu + DH = one cluster with multiple `sources`. Prefer the fuller factual blurb as the base text.
4. **Scannable cards, not walls of text.** News/tech: gist (1–2 sentences) + one short paragraph + What this is (concept / told / purpose) + Important points. Opinion: gist + bullets only.
5. **Fidelity.** Do not invent facts. Headlines and all structured fields must come from digest records. Keep ₹ figures, dates, names, and outcomes.
6. **Delete scratch.** Remove `candidates.json` after finals. `Full_paper/` should end with only the two `FullPaper_*` files.
7. **Do not backfill old days.** Only write Full Paper for the date the user named (or today's new digest day). Leave past `work/<date>/` folders unchanged unless the user explicitly asks to generate Full Paper for that date.

## Work folder layout

```
work/<DD-Mon-YYYY>/
  The_Hindu/
  News_Trail/
  Daily_top/          # leave alone
  Full_paper/         # this skill writes here
    FullPaper_<DD-Mon-YYYY>.md
    FullPaper_<DD-Mon-YYYY>.json
```

## Step 1 — Resolve the date

Use the date the user names, or infer from folders under `work/`. Normalize to `DD-Mon-YYYY`. Create `work/<DD-Mon-YYYY>/Full_paper/`.

## Step 2 — Collect candidates

```bash
SCRIPT=".cursor/skills/daily-full-paper/scripts/collect_full_candidates.py"
if [ ! -f "$SCRIPT" ]; then
  SCRIPT="${HOME}/.cursor/skills/daily-full-paper/scripts/collect_full_candidates.py"
fi
python3 "$SCRIPT" --work "<workspace>/work" --date "31-Aug-2026" \
  --out "work/31-Aug-2026/Full_paper/candidates.json"
```

The script tags each article `section`: `news` | `technology` | `opinion`. Skip `Daily_top/`, `Coastal_Katte/`, `Full_paper/`.

If the script is missing, load each paper folder's digest JSON manually.

## Step 3 — Cluster, rank, rewrite

1. **Cluster** near-identical stories (same event / principal actors) within each section. One output item; `sources` lists every paper/page.
2. **Complete news:** place each news cluster in its digest `scope` bucket (`lifestyle` and `other` included).
3. **Technology Top 5:** rank by public-impact (research breakthroughs, major digital/policy/tech incidents, space, AI, platforms) then prominence and cross-paper presence. At most 5 in `top5`; remaining tech clusters go to `rest`. If fewer than 5 exist, take all.
4. **Opinion & Explainers:** `kind: opinion`, plus FAQ / Q&A / explainer / long fact pieces (headline or blurb cues: FAQ, Explainer, In Focus, Q&A, “What is”, “Why does”). Order: paper editorials first, then other explainers; within that, page order.
5. **Rewrite** every cluster to the card format in `references/output-spec.md`. When merging, start from the fuller blurb. Do not add claims that are not in the blurbs.

Optional helper to cluster + emit a first draft from blurbs (always review and fix weak cards):

```bash
python3 ".cursor/skills/daily-full-paper/scripts/assemble_full_paper.py" \
  --work "<workspace>/work" --date "31-Aug-2026" \
  --out-dir "work/31-Aug-2026/Full_paper"
```

The agent owns the final wording. Fix mechanical gist/purpose lines that are generic or drop load-bearing facts.

## Step 4 — Write both outputs

Into `work/<DD-Mon-YYYY>/Full_paper/` only:

- `FullPaper_<DD-Mon-YYYY>.md`
- `FullPaper_<DD-Mon-YYYY>.json`

Delete `candidates.json` after the finals are written.

## Step 5 — Publish to Firestore

From `viewer/`:

```bash
npm run sync-firestore
```

This upserts `editions/{date_slug}` and one `articles/{id}` doc per clustered story. Keep the JSON in `work/` as the source of truth. If Admin credentials are not available, leave this to CI (`deploy-viewer.yml` runs the same script).

## Step 6 — Deliver

Short summary only: date, papers scanned, source articles → clusters, counts per section, paths. Do not paste the full brief into chat.

## Quality checklist

- Every digest article is in exactly one cluster in exactly one section (news bucket, technology, or opinion).
- Cross-paper duplicates appear once, with `sources` listing papers.
- News/tech cards have gist, paragraph, what_this_is, important_points.
- Opinion cards have gist and points only (no long paragraph field).
- Technology `top5.selected_count` ≤ 5; ranks 1–N consecutive.
- JSON keys match `references/output-spec.md`.
- `Full_paper/` ends with only the two FullPaper files.
- After JSON exists, `cd viewer && npm run sync-firestore` (or CI) so the viewer can fetch the day.

---
name: daily-local-coastal-top5
description: >-
  Preferred daily pipeline: digest that day’s newspaper PDFs with
  newspaper-page-digest, then Local Top 5 and Coastal Katte Top 5, verify the
  viewer UI, commit and land on main so Firebase Hosting auto-publishes, and
  notify the user when deploy completes. Skips Full Paper, Shorts/reel scripts,
  and YouTube. Use when the user asks for the “daily local and coastal top 5”
  pack, “digest then top 5”, “preferred daily pack”, names this skill, or runs
  /daily-local-coastal-top5.
---

# Daily Local + Coastal Top 5

One combined pipeline for the preferred daily pack:

```
newspaper-page-digest → daily-local-top → coastal-katte-top5
  → UI verify → land on main (Firebase Hosting) → notify user
```

**Do not** invent parallel digest/ranking logic. Load and follow each child skill **exactly** (output specs, hard lessons, layouts stay in those skills).

| Step | Skill | Path |
|:-----|:------|:-----|
| 1 | `newspaper-page-digest` | `.cursor/skills/newspaper-page-digest/SKILL.md` |
| 2 | `daily-local-top` | `.cursor/skills/daily-local-top/SKILL.md` |
| 3 | `coastal-katte-top5` | `.cursor/skills/coastal-katte-top5/SKILL.md` |
| 4–7 | UI verify, push, notify | this skill (below) |

## Skip (never run in this pipeline)

| Product | Skill / output |
|:--------|:---------------|
| Full Paper | `.cursor/skills/daily-full-paper/` → `work/<date>/Full_paper/FullPaper_*` |
| YouTube briefing | `.cursor/skills/coastal-katte-youtube/` → `work/<date>/Coastal_Katte/youtube/` |
| Shorts / 1-min reel scripts | `.cursor/skills/coastal-katte-script/` → `work/<date>/Coastal_Katte/scripts/` |

Do **not** expand into other leftover packs from `daily-after-digest` beyond Local Top 5 + Coastal Katte Top 5.

## Hard lessons

1. **Digest is step 1 of this pipeline** — not an external prerequisite. Run `newspaper-page-digest` for every paper for the day before Local Top 5.
2. **One shared date** (`DD-Mon-YYYY`) for digests, Top 5, verify, and publish.
3. **Gate later steps** — do not start Local Top 5 until every expected paper has validated `*_PageDigest.md` + `*_PageDigest.json`. Do not start Coastal Katte until `LocalTop5_*.json` exists.
4. **Do not rewrite** PageDigests unless the user asked to rebuild that paper. Do not backfill older dates unless named.
5. **Do not run** Full Paper, YouTube, or reel script skills.
6. **Chat replies stay short** — summaries + paths only; never paste full digests or Top 5 lists.
7. **Publish means `main`** — Firebase Hosting deploy runs on push to `main` via **Deploy viewer to Firebase Hosting** (`.github/workflows/deploy-viewer.yml`). Notify the user when that deploy succeeds.

## Step 1 — Newspaper page digest

Follow **`.cursor/skills/newspaper-page-digest/SKILL.md`** exactly (and its `references/output-spec.md`).

1. Collect every newspaper PDF the user attached or named for this day.
2. Digest **each paper** (one paper per skill run; parallel Task subagents per PDF are fine — same pattern as `daily-full-pipeline`).
3. Write under `work/<DD-Mon-YYYY>/<Paper_Slug>/` only; after cleanup each paper folder keeps **only** `*_PageDigest.md` + `*_PageDigest.json`.
4. Confirm every expected paper for the day has both digest files under the **same** date folder before continuing.

If digests for this date already exist and the user did not ask to rebuild, you may keep them and continue to step 2.

## Step 2 — Local Top 5

Follow **`.cursor/skills/daily-local-top/SKILL.md`** exactly.

Outputs:

- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json`

## Step 3 — Coastal Katte Top 5

Follow **`.cursor/skills/coastal-katte-top5/SKILL.md`** exactly.

Input: `work/<date>/Daily_top/LocalTop5_<date>.json` only.

Outputs:

- `work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json`

Do **not** create `scripts/` or `youtube/` under `Coastal_Katte/` in this pipeline.

## Step 4 — Verify UI

Confirm the date appears and **both** Local Top 5 and Coastal Katte render correctly:

| Mode | Data source |
|:-----|:------------|
| Dev (`cd viewer && npm run dev`) | Vite `/api/local-top5/:date` and `/api/coastal-katte/:date` read `work/<date>/…` (`viewer/vite.work-api.ts`) |
| Production static | `viewer/scripts/prepare-static-data.mjs` → `public/data/<date>/local-top5.json` and `coastal-katte.json` |

Checks: date in dropdown; Local Top 5 six buckets; Coastal Katte ranks; headlines/blurbs match the JSON.

Optional local Firestore sync (CI also runs this on deploy):

```bash
cd viewer && npm run sync-firestore
```

If credentials are missing locally, still keep `work/` JSON and rely on the deploy workflow.

## Step 5 — Commit + land on `main` (Firebase auto-publish)

Stage that day’s publishable outputs under `work/<date>/`:

- Paper `*_PageDigest.*`
- `Daily_top/`
- `Coastal_Katte/CoastalKatte_Top5_.*` (not `scripts/` / `youtube/`)

Exclude: `work/_temp/`, `.firebase/`, secrets, intermediates (`pages/`, `transcripts/`, `edited/`).

Land on **`main`** (direct push, or PR **merged into `main`**). That push triggers:

| Item | Value |
|:-----|:------|
| Workflow | **Deploy viewer to Firebase Hosting** |
| File | `.github/workflows/deploy-viewer.yml` |
| Trigger | `push` to `main` (path filters include `work/**/Daily_top/**` and `work/**/Coastal_Katte/CoastalKatte_Top5_*.json`) |
| CI | `npm run sync-firestore` → build (includes `prepare-data`) → Hosting `live` for project `newspaper-page-digest` |
| Sites | https://newspaper-page-digest.web.app · https://newspaper-page-digest.firebaseapp.com |

Ensure Top 5 JSON paths are included so the Action’s path filters fire. Do not force-push, skip hooks, or commit secrets.

## Step 6 — Notify when Firebase deploy completes

1. Wait until **Deploy viewer to Firebase Hosting** succeeds on the `main` commit.
2. Spot-check the live site for the date (Local Top 5 + Coastal Katte).
3. **Notify the user** that publish/merge to Firebase completed (date + live URL).

## Deliver

One short block:

- Date and papers digested
- Paths: each PageDigest pair, Local Top 5, Coastal Katte Top 5
- UI verify result
- Commit / branch / Action result
- Confirmation that the user was notified of deploy completion

## Related

- Sibling after digests-only (no digest step): `.cursor/skills/daily-after-digest/SKILL.md`
- Sibling one-shot with parallel digests: `.cursor/skills/daily-full-pipeline/SKILL.md`
- Slash command: `.cursor/commands/daily-local-coastal-top5.md`

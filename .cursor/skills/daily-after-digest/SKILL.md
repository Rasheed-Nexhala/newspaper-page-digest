---
name: daily-after-digest
description: >-
  After all newspapers for a day are digested, run the rest of the daily pack in
  one go: Local Top 5, Coastal Katte Top 5, Full Paper, and the YouTube Top 5
  briefing. Does not write the 1-minute reel script. Use when the user asks to
  "finish the day", "daily pack", "after digest", "do the rest", or names this
  skill / /daily-after-digest.
---

# Daily after digest

One command after **every paper for the day** has a `*_PageDigest.json`. Digesting stays per newspaper (`/digest-newspaper`). This skill does **not** digest PDFs and **does not** write Coastal Katte reel scripts (`/coastal-katte-script`).

Follow each child skill **exactly** (do not invent a parallel output layout).

## Order

1. **`daily-local-top`** — `work/<date>/Daily_top/LocalTop5_*`
2. **`coastal-katte-top5`** — needs Local Top 5 — `work/<date>/Coastal_Katte/CoastalKatte_Top5_*`
3. **`daily-full-paper`** — needs PageDigests only — `work/<date>/Full_paper/FullPaper_*`
4. **`coastal-katte-youtube`** — needs Coastal Katte Top 5 — `work/<date>/Coastal_Katte/youtube/CoastalKatte_YT_Top5_*.md`

Steps 2 and 3 are independent of each other; 3 may run right after 1. Step 4 waits for step 2.

## Hard lessons

1. **Resolve one date** (`DD-Mon-YYYY`) and use it for every child skill. Infer from the newest `work/` folder with PageDigests if the user did not name a date.
2. **Need at least one** `work/<date>/<Paper>/*_PageDigest.json`. If none, stop and tell the user to `/digest-newspaper` first.
3. **Do not rewrite** existing PageDigest files. Do not change older dates’ `Daily_top/` or `Coastal_Katte/` unless this run’s date is that folder.
4. **Do not backfill** Full Paper (or anything else) into past days unless the user named that past date.
5. **Skip `/coastal-katte-script`.** Only run it if the user separately asks for a reel script.
6. Chat reply: short summary + all output paths. Do not paste full briefs or the YouTube script.

## Step 1 — Date and inputs

- Date = user-named, else the date folder you just digested, else the newest `work/<DD-Mon-YYYY>/` that contains a PageDigest.
- Confirm papers: every sibling folder except `Daily_top`, `Coastal_Katte`, `Full_paper`.

## Step 2 — Run child skills

Load and follow, in order:

- `.cursor/skills/daily-local-top/SKILL.md`
- `.cursor/skills/coastal-katte-top5/SKILL.md`
- `.cursor/skills/daily-full-paper/SKILL.md`
- `.cursor/skills/coastal-katte-youtube/SKILL.md`

If Local Top 5 or Coastal Katte Top 5 already exists for **this** date and the user did not ask to rebuild, you may keep them and still build any missing Full Paper / YouTube outputs. If the user said “rebuild the day”, redo all four.

## Step 3 — Sync Full Paper to Firestore

After `FullPaper_<date>.json` exists, publish clustered articles to Firestore so the viewer Full Paper tab and Search can fetch them:

```bash
cd viewer && npm run sync-firestore
```

Requires Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT` JSON or Application Default Credentials). If credentials are missing, still finish the JSON/Markdown outputs and tell the user to run `npm run sync-firestore` (or wait for the deploy workflow, which runs the same command).

Do not skip writing `work/` JSON. Firestore is a publish step, not a replacement for the digest files.

## Step 4 — Deliver

One short block:

- Date and papers scanned
- Local Top 5 path
- Coastal Katte Top 5 path
- Full Paper path
- YouTube briefing path
- Firestore sync result (or reminder to run `cd viewer && npm run sync-firestore`)
- Reminder: reel script is **`/coastal-katte-script`** when they pick a story

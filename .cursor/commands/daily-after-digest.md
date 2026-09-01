---
name: daily-after-digest
description: After all papers for a day are digested, build Local Top 5, Coastal Katte Top 5, Full Paper, and the YouTube briefing (not the reel script).
---

# Daily after digest

Follow the `daily-after-digest` skill (`.cursor/skills/daily-after-digest/SKILL.md`).

Digesting is **not** this command — still `/digest-newspaper` once per paper. When every paper for the day is digested, this command does the rest **except** `/coastal-katte-script`.

1. Resolve the date. Confirm `work/<date>/<Paper>/*_PageDigest.json` exists.
2. Run **`daily-local-top`** (see that skill + output-spec).
3. Run **`coastal-katte-top5`**.
4. Run **`daily-full-paper`**.
5. Run **`coastal-katte-youtube`**.
6. Do **not** write a 1-minute reel script unless the user asks.
7. Short summary + all file paths only.

Do not rewrite PageDigests. Do not backfill older date folders unless the user named that date.

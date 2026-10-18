---
name: daily-after-digest
description: After all papers for a day are digested, build Local Top 5 and Coastal Katte Top 5 (Full Paper, YouTube, and reel scripts are disabled).
---

# Daily after digest

Follow the `daily-after-digest` skill (`.cursor/skills/daily-after-digest/SKILL.md`).

Digesting is **not** this command — still `/digest-newspaper` once per paper. When every paper for the day is digested, this command does the rest. For digests + pack + deploy in one go, use **`/daily-full-pipeline`**.

1. Resolve the date. Confirm `work/<date>/<Paper>/*_PageDigest.json` exists.
2. Run **`daily-local-top`** (see that skill + output-spec).
3. Run **`coastal-katte-top5`**.
<!-- Disabled:
4. Run **`daily-full-paper`**.
5. Run **`coastal-katte-youtube`**.
6. Do **not** write a 1-minute reel script unless the user asks.
-->
4. Do **not** run Full Paper, YouTube briefing, or reel script — they are disabled.
5. Short summary + all file paths only.

Do not rewrite PageDigests. Do not backfill older date folders unless the user named that date.

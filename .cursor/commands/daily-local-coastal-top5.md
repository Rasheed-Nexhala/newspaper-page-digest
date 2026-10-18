---
name: daily-local-coastal-top5
description: >-
  Preferred daily pack — digest today’s papers, Local Top 5, Coastal Katte Top 5,
  UI verify, then land on main for Firebase Hosting publish (skips Full Paper,
  Shorts, YouTube).
---

# Daily Local + Coastal Top 5

Follow the `daily-local-coastal-top5` skill (`.cursor/skills/daily-local-coastal-top5/SKILL.md`).

**Usage:** attach or name newspaper PDFs for the day, e.g.

`/daily-local-coastal-top5 /path/Deccan_Herald.pdf /path/The_Hindu.pdf`

1. Run **`newspaper-page-digest`** for every paper for the day (first).
2. Run **`daily-local-top`**.
3. Run **`coastal-katte-top5`**.
4. **Skip** Full Paper, Shorts/reel scripts, and YouTube.
5. Verify the viewer UI shows the date (Local Top 5 + Coastal Katte).
6. Commit + land on **`main`** so **Deploy viewer to Firebase Hosting** publishes.
7. Notify the user when deploy/merge to Firebase completes.

Short summary + paths only — never paste full digests or briefs.

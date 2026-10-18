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
4. **Gate B (blocking):** run `python3 .cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py` with that day’s Top 5 JSON + edition `--pdf-dir` (use `--force-ocr` for News Trail). Exit 0 required; paste stdout into the PR. See `scripts/README-gate-b.md`.
5. **Skip** Full Paper, Shorts/reel scripts, and YouTube.
6. Verify the viewer UI shows the date (Local Top 5 + Coastal Katte).
7. Commit + land on **`main`** so **Deploy viewer to Firebase Hosting** publishes.
8. Notify the user when deploy/merge to Firebase completes.

## Permanent rules (blocking)

See `AGENTS.md`. Never waive:

1. **Never invent, infer, or fill in** a story, number, name, quote, date, or weekday — only PDF text layer or OCR/vision on the page image.
2. Empty/thin text → render page → OCR/vision; if still unreadable → **"page unreadable"** — never fill in.
3. **Gate A** (per paper) + **Gate B** (every Top 5 `paper`+`page`) — DH, Hindu, NT, every day. Gate B = **`gate_b_check.py`** exit 0 + stdout in PR (not verbal QA).
4. **Weekdays from the date** — never guess.
5. **Any gate fail** → no merge/deploy; report failure.
6. **PR description** must include Gate B script output (and Gate A notes).

Short summary + paths only — never paste full digests or briefs.

---
name: daily-full-pipeline
description: One-shot day — digest all attached/named newspaper PDFs in parallel, run the daily pack, then commit and deploy.
---

# Daily full pipeline

Follow the `daily-full-pipeline` skill (`.cursor/skills/daily-full-pipeline/SKILL.md`). Child skills (`newspaper-page-digest`, `daily-after-digest`, and their children) are followed **exactly** — do not reinvent them.

**Usage:** attach PDFs or pass paths, e.g.

`/daily-full-pipeline /path/Deccan_Herald.pdf /path/News_Trail.pdf /path/The_Hindu.pdf`

1. Collect every PDF the user attached or named.
2. **Phase 1 — Digest:** launch **one background Task subagent per PDF** (parallel). Each follows `newspaper-page-digest` for that paper only. Wait until every paper has validated `*_PageDigest.md` + `*_PageDigest.json` under one shared `work/<DD-Mon-YYYY>/`.
3. **Phase 2 — Daily pack:** run **`daily-after-digest`** for that date (Local Top 5 → Coastal Katte Top 5 → `cd viewer && npm run sync-firestore`). Full Paper, YouTube, and reel scripts are disabled. Do **not** start until Phase 1 is fully done.
4. **Phase 3 — Commit + deploy:** commit that day’s `work/<date>/` publish outputs (exclude `work/_temp/`, `.firebase/`, secrets, intermediates). Push to origin so CI deploys, or deploy Hosting/Firestore locally if that is required. This command **always** ends with commit+deploy.
5. Short summary + all paths only — never paste full digests or briefs.

Do not backfill older dates. Do not serialize all papers in one agent.

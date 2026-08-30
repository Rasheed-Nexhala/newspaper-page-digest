---
name: daily-local-top
description: Build Top 5 Mangaluru / Coastal Karnataka / Karnataka lists from all newspaper digests for a day.
---

# Daily local top 5

Follow the `daily-local-top` skill exactly (workspace `.cursor/skills/daily-local-top/SKILL.md` or `~/.cursor/skills/daily-local-top/SKILL.md`) and `references/output-spec.md`.

1. Resolve the target date (user-named or from today's digests).
2. Collect all `work/<date>/<Paper>/*_PageDigest.json` (skip `Daily_top/`) via `scripts/collect_local_candidates.py`.
3. Deduplicate cross-paper stories; rank Top 5 per scope (`mangaluru`, `coastal_karnataka`, `karnataka`).
4. Write both files under `work/<DD-Mon-YYYY>/Daily_top/`:
   - `LocalTop5_<DD-Mon-YYYY>.md`
   - `LocalTop5_<DD-Mon-YYYY>.json`
5. Return a short summary plus both paths — do not paste the full brief into chat.

---
name: daily-full-paper
description: Build a complete Full Paper reader (clustered news, Technology Top 5, Opinion & Explainers) from all newspaper digests for a day.
---

# Daily Full Paper

Follow the `daily-full-paper` skill exactly (workspace `.cursor/skills/daily-full-paper/SKILL.md` or `~/.cursor/skills/daily-full-paper/SKILL.md`) and `references/output-spec.md`.

If you just finished digesting **all** papers for the day, prefer **`/daily-after-digest`** (this Full Paper plus Local Top 5, Coastal Katte Top 5, and YouTube). Do not backfill older dates unless the user names that date.

1. Resolve the target date (user-named or from today's digests).
2. Collect all `work/<date>/<Paper>/*_PageDigest.json` (skip `Daily_top/`, `Coastal_Katte/`, `Full_paper/`) via `scripts/collect_full_candidates.py`.
3. Cluster cross-paper duplicates; send tech/science/digital stories to Technology (Top 5 + rest); send editorials, FAQs, and explainers to Opinion & Explainers; remaining hard news by `scope`.
4. Rewrite each cluster into the scannable card format (news/tech: gist + paragraph + what this is + important points; opinion: gist + bullets).
5. Write both files under `work/<DD-Mon-YYYY>/Full_paper/`:
   - `FullPaper_<DD-Mon-YYYY>.md`
   - `FullPaper_<DD-Mon-YYYY>.json`
6. Return a short summary plus both paths — do not paste the full brief into chat.

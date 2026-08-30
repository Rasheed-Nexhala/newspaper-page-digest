---
name: coastal-katte-top5
description: Pick a focused Top 5 for @coastal_katte from the day's LocalTop5 (Mangaluru / Coastal / Karnataka).
---

# Coastal Katte Top 5

Follow the `coastal-katte-top5` skill exactly (workspace `.cursor/skills/coastal-katte-top5/SKILL.md` or `~/.cursor/skills/coastal-katte-top5/SKILL.md`), plus `references/output-spec.md` and `references/channel-strategy.md`.

1. Resolve the date; load `work/<date>/Daily_top/LocalTop5_<date>.json` (run `/daily-local-top` first if missing).
2. Flatten all three buckets; score for Coastal Katte (infra+₹+dates, safety, accountability, local jobs; prefer Mangaluru/coastal; skip SIR/soft/protest-filler/pure Bengaluru insider).
3. Write both files under `work/<DD-Mon-YYYY>/Coastal_Katte/`:
   - `CoastalKatte_Top5_<DD-Mon-YYYY>.md`
   - `CoastalKatte_Top5_<DD-Mon-YYYY>.json`
4. Keep frozen JSON keys. Short summary + paths only — do not paste the full brief unless asked.

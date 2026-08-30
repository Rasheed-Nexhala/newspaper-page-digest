---
name: coastal-katte-script
description: Write a 1-minute Coastal Katte Shorts script (3 hook variations + verified hybrid) for a chosen story.
---

# Coastal Katte script

Follow the `coastal-katte-script` skill exactly (`.cursor/skills/coastal-katte-script/SKILL.md` or `~/.cursor/skills/coastal-katte-script/SKILL.md`), plus `references/script-spec.md` and `references/writing-rules.md`.

1. **Resolve story** (any of these):
   - Rank + date from Coastal Katte Top 5 (e.g. `#2` on `30-Aug-2026`)
   - Headline / free pick from that day’s digests
   - **Full article paste** (or file path) — overrides digest blurbs when provided
2. Default source = generated Top 5 / digest if no paste. Mark `source_depth` as `full-article` or `digest-blurb`.
3. Sponsor in brief → **HCAC**; else **HCC**.
4. Workflow in order: 3 variations (curiosity / question / shock) → verify vs source → one final hybrid with zero `[UNVERIFIED]` → verification report.
5. Save under `work/<DD-Mon-YYYY>/Coastal_Katte/scripts/`:
   - `<slug>_script.md` only (no JSON sidecar)
6. Chat: short summary + MD path only (don’t paste all scripts unless asked).

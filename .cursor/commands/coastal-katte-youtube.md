---
name: coastal-katte-youtube
description: Write a 4–6 minute YouTube Top 5 briefing script from Coastal Katte Top 5 (all five stories in order).
---

# Coastal Katte YouTube Top 5

Follow the `coastal-katte-youtube` skill exactly (`.cursor/skills/coastal-katte-youtube/SKILL.md` or `~/.cursor/skills/coastal-katte-youtube/SKILL.md`) and `references/yt-spec.md`.

1. Load `work/<date>/Coastal_Katte/CoastalKatte_Top5_<date>.json` (run `/coastal-katte-top5` first if missing). Date = user-named or latest folder.
2. If the user pastes a SCRIPT MD or full articles for any rank, those override default beats / blurbs for those ranks.
3. Write **one** 4–6 min teleprompter: intro (“today’s Top 5 from …”) → stories **1→5** (what happened, numbers/dates, why it matters, labeled host take) → close. Plus **2–3 alternate cold opens**.
4. Same file: title options, description, timestamps, thumbnail text, thumbnail prompt (host photo + news B-roll/props; no fake headlines).
5. No sponsor unless the user says so. Facts from sources only; host take must not invent news.
6. Save **Markdown only**: `work/<DD-Mon-YYYY>/Coastal_Katte/youtube/CoastalKatte_YT_Top5_<DD-Mon-YYYY>.md`
7. Chat: short summary + path — do not paste the full script unless asked.

---
name: coastal-katte-youtube
description: >-
  Writes a 4–6 minute YouTube briefing script covering all five Coastal Katte
  Top 5 stories in rank order for @coastal_katte. Not a 1-minute reel: intro,
  then each story explained clearly, then close. Packaging includes title,
  description, timestamps, thumbnail text, and a thumbnail prompt (host photo +
  news B-roll/props). Use when the user asks for a "YouTube script", "YouTube
  Top 5", "daily 5 video", "long-form briefing", or names this skill/command.
---

# Coastal Katte YouTube Top 5

Turn the day's **Coastal Katte Top 5** into **one** YouTube video script that walks **all five stories in rank order**.

This is **not** `/coastal-katte-script` (Instagram/Shorts, one story, ~60s). This is a **4–6 minute** briefing: “let’s talk about today’s Top 5” → explain each one clearly → close.

If the user pastes or points to a **SCRIPT MD** (their own template), **follow that structure** over the default beats below. Otherwise use this skill’s template.

Read `references/yt-spec.md` before writing.

## Locked choices (from setup)

| Setting | Value |
|:--------|:------|
| Input | `CoastalKatte_Top5_<date>.json` only |
| Length | 4–6 minutes spoken |
| Language | Simple English a 16-year-old understands |
| Order | Rank 1 → 5 (no reorder unless the user explicitly reorders) |
| Versions | One teleprompter + **2–3 alternate cold opens** (not 3 full scripts) |
| Sponsor | **Never** unless the user says so that run |
| Output | Markdown only under `work/<date>/Coastal_Katte/youtube/` |
| Channel | Coastal Katte (@coastal_katte) |
| Facts | Digest blurbs by default; user may paste full article text for any of the 5 |

## Hard lessons

1. **Fidelity.** Every news fact, figure, date, name, and quote must come from the resolved source (Top 5 blurb and/or pasted article). No invention, no unrelated wording, no dropped ₹ / dates / key names.
2. **Facts vs host take.** News explanation is source-only. A short **HOST TAKE** is allowed and must be labeled so viewers know it is Shaz, not the newspaper. Host take must not smuggle new facts. If the user did not give an opinion, keep HOST TAKE to “why this matters in daily life” using **only** sourced facts (deadline, commute, park, court date). Do **not** invent what government should do or who is guilty.
3. **One video, five stories.** Do not skip a rank. Do not merge two ranks into one segment.
4. **Not a reel.** No 6-word Instagram hook format, no HCC 50–60s body. Pace for YouTube: clear sentences you can read aloud.
5. **Thin blurbs.** If a story is digest-only and thin, mark `source_depth: digest-blurb` in **Story notes (not for camera)** — never inside Teleprompter — and do not invent filler. Offer a full-article paste for denser facts.

## Work layout

```
work/<DD-Mon-YYYY>/
  Coastal_Katte/
    CoastalKatte_Top5_<DD-Mon-YYYY>.json   # INPUT
    youtube/
      CoastalKatte_YT_Top5_<DD-Mon-YYYY>.md
```

## Step 1 — Load the five

1. Resolve date (`DD-Mon-YYYY`).
2. Read `work/<date>/Coastal_Katte/CoastalKatte_Top5_<date>.json`.
3. If missing: tell the user to run `/coastal-katte-top5` first.
4. If the user pasted full article text for rank N, that paste **overrides** the blurb for that rank only.

**Intro geography line:** use only scopes present in the five items.

- All `mangaluru` → “today’s Top 5 from Mangaluru”
- Mix of `mangaluru` / `coastal_karnataka` / `karnataka` → name only those that appear, e.g. “Mangaluru, coastal Karnataka, and Karnataka”

Do not claim “all of Karnataka’s news” if the list is the channel shortlist.

## Step 2 — Write the MD

Follow `references/yt-spec.md` exactly.

**Spoken target (guide, not a stopwatch):**

| Beat | Approx. |
|:-----|:--------|
| Cold open + intro | 20–35s |
| Each story (×5) | 40–55s |
| Close + CTA | 20–30s |
| **Total** | **~4–6 min** |

**Teleprompter = spoken script under clear highlighted headings.** Separate every topic with `###` headings + `---` between blocks so the script is easy to scan. Body under each heading is what the host says — no `source_depth`, tables, or beat labels like `**What happened:**`.

Required teleprompter structure:

1. `### INTRO` — geography line + five-topic list
2. `### NUMBER 1 — <headline>` … `### NUMBER 5 — <headline>` in rank order, each separated by `---`
3. Under each number: say the rank (“Number one…”), then what happened + numbers/dates + why it matters as spoken paragraphs
4. Bold side heading `**Host take**` then 1–2 spoken sentences; omit the whole block if nothing safe
5. `### CLOSE` — sourced recap + CTA

Put `source_depth`, fact checklists, and beat scaffolding in **Story notes (not for camera)** outside Teleprompter. Packaging, cold opens, and verification stay outside too.

**Cold opens (2–3 alts)** — different first 5–8 seconds; then the same intro+body. Not three full videos.

**Packaging (required in the same MD):**

- 3 YouTube **title** options
- **Description** (plain, sourced; no invented claims)
- **Timestamps / chapters**
- **Thumbnail text** (few words)
- **Thumbnail prompt** — host photo in front; related news stills or a simple prop behind; 16:9; no fake headlines or unsourced numbers in the prompt

## Step 3 — Verify + deliver

1. Line-check every news sentence against source. Flag `[UNVERIFIED — confirm before posting]` then **cut or confirm** before the final teleprompter. Final spoken script: **zero** flags.
2. HOST TAKE lines may stay without flags if they add no unsourced facts.
3. Chat: date, 5 headlines in order, path to the MD. Do not paste the full script unless asked.

## Quality checklist

- [ ] All 5 ranks present, in order
- [ ] Intro geography matches actual scopes
- [ ] No invented news; load-bearing facts kept
- [ ] Topics separated with `### NUMBER N — …` headings and `---` between them
- [ ] `**Host take**` bold side heading (or omitted); fact-safe
- [ ] Teleprompter body is spoken script only (no source_depth / tables / What happened labels)
- [ ] Title, description, timestamps, thumbnail text, thumbnail prompt present
- [ ] 2–3 alternate cold opens
- [ ] File is MD only under `youtube/`
- [ ] Final teleprompter has zero `[UNVERIFIED]`

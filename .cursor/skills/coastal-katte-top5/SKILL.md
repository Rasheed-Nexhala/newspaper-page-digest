---
name: coastal-katte-top5
description: >-
  Picks a focused Top 5 from the day's LocalTop5 (Mangaluru + Coastal Karnataka
  + Karnataka) for the Coastal Katte Instagram channel (@coastal_katte). Ranks
  by local daily-life impact, infrastructure/rupee hooks, safety, accountability,
  and shareability — not by paper prominence alone. Use when the user asks for
  "Coastal Katte top 5", "channel top 5", "reel shortlist", "what to post today",
  or names this skill /command.
---

# Coastal Katte Top 5

Turn the day's `LocalTop5_*.json` (15 candidates across three buckets) into **one focused Top 5** for posting on **Coastal Katte** (@coastal_katte).

Read `references/output-spec.md` (frozen JSON) and `references/channel-strategy.md` (ranking rules from the channel audit) before writing.

## Hard lessons

1. **Input is LocalTop5 only** — do not re-scan full PageDigests unless LocalTop5 is missing and the user asks you to run `/daily-local-top` first.
2. **Channel fit ≠ civic importance alone.** A big Bengaluru Cabinet story can lose to a smaller Mangaluru bridge/tax/safety story if the latter converts better for Coastal Katte.
3. **Geography preference:** Mangaluru > coastal belt (DK/Udupi) > rest of Karnataka, unless a Karnataka story has a sharp coastal/Mangaluru daily-life hook.
4. **JSON schema is frozen** — exact keys in `references/output-spec.md`. No drift.
5. **Write under** `work/<DD-Mon-YYYY>/Coastal_Katte/` only (sibling of paper folders and `Daily_top/`).
6. **Fidelity:** Copy headline/blurb from LocalTop5 unchanged (trim whitespace only). Do not invent, punch-up, or add unrelated wording. `why_channel` is creator-facing rationale only — it must not invent news facts; put no new claims in `headline`/`blurb`.

## Work layout

```
work/<DD-Mon-YYYY>/
  The_Hindu/
  News_Trail/
  Daily_top/
    LocalTop5_<DD-Mon-YYYY>.json   # INPUT
  Coastal_Katte/                   # OUTPUT
    CoastalKatte_Top5_<DD-Mon-YYYY>.md
    CoastalKatte_Top5_<DD-Mon-YYYY>.json
    scripts/                       # reel scripts (coastal-katte-script)
    youtube/                       # YouTube Top 5 briefing (coastal-katte-youtube)
```

## Step 1 — Load input

1. Resolve date (`DD-Mon-YYYY`).
2. Read `work/<date>/Daily_top/LocalTop5_<date>.json`.
3. If missing: tell the user to run `/daily-local-top` first (or offer to run it). Do not invent a LocalTop5.

Flatten all items from `buckets.mangaluru`, `buckets.coastal_karnataka`, and `buckets.karnataka` into one candidate pool (up to 15). Keep each item's `scope`, `headline`, `blurb`, `sources`, and original bucket rank.

## Step 2 — Score for Coastal Katte

Score each candidate using `references/channel-strategy.md`. In short, **boost**:

- Hard local infrastructure (bridges, roads, flyovers, parks, industrial parks) with **₹ figures** and/or **completion dates**
- Big investment / jobs tied to Mangaluru–coastal economy
- Crime, corruption, civic accountability with personal stakes (“this could happen to you”)
- Public health / safety / women's safety
- Actionable deadlines, dates, events people will forward on WhatsApp

**Penalize / usually skip:**

- SIR / voter-roll minutiae, wonky election process without a sharp personal hook
- Protest coverage without a concrete local outcome (occasional OK, not a growth pick)
- Soft commercial openings, bank-branch inaugurals, lifestyle fillers
- Pure Bengaluru/state insider politics with no coastal daily-life angle
- Sports roundups unless the hook is a Mangaluru stadium/infra decision

Pick exactly **5** (or fewer if the pool is thin). Deduplicate if LocalTop5 somehow repeated the same event. **Reuse headline/blurb from LocalTop5 verbatim** (whitespace trim only) — do not invent facts or rephrase in a way that adds or drops load-bearing details.

For each pick, add a short `why_channel` line (1 sentence) explaining Coastal Katte fit — for the creator, not for the reel caption. `why_channel` may cite channel strategy; it must not invent story facts.

## Step 3 — Write outputs

Into `work/<DD-Mon-YYYY>/Coastal_Katte/`:

- `CoastalKatte_Top5_<DD-Mon-YYYY>.md`
- `CoastalKatte_Top5_<DD-Mon-YYYY>.json`

Follow `references/output-spec.md` exactly.

## Step 4 — Deliver

2–3 lines: date, source LocalTop5 path, ranks 1–5 headlines only, paths to both files. Do not paste full blurbs into chat unless asked.

## Quality checklist

- All 5 (or fewer) traceable to LocalTop5 items.
- JSON keys match frozen schema.
- `why_channel` present on every item.
- Preference order and boost/penalize rules followed.
- Folder ends with only the two CoastalKatte_Top5 files (no scratch).

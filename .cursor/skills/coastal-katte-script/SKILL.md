---
name: coastal-katte-script
description: >-
  Writes a 1-minute Instagram/YouTube Shorts news script for Coastal Katte
  (@coastal_katte) from a chosen story. Supports picking by Coastal Katte Top 5
  rank+date, by headline, or from pasted full article text. Produces 3 hook
  variations (curiosity/question/shock), verifies against source, then one final
  hybrid script. Use when the user asks for a "script", "reel script", "shorts
  script", "HCC", "HCAC", "Coastal Katte script", or names this skill/command.
---

# Coastal Katte Script Writer

Write a **1-minute** Instagram / YouTube Shorts news script for **Coastal Katte** (@coastal_katte).

Audience: 20–60 Mangaloreans (local + diaspora — Gulf, UK, Canada, Australia). They don’t read newspapers — this is their news. Language: simple English a 16-year-old understands.

Read `references/script-spec.md` (HCC/HCAC beats, output format) and `references/writing-rules.md` before drafting.

## Hard lessons

1. **Single source of truth.** Every fact, figure, date, and quote must trace to the resolved source text. No speculation, no invented quotes, no “estimated” numbers, no outside context, no unrelated wording.
2. **Prefer full article when provided.** If the user pastes article text (or a path to a full article), that overrides digests/blurbs.
3. **Default source = generated digests.** If no full article is pasted, load from Coastal Katte Top 5 / PageDigest for the named date+rank or matching headline — and treat thin blurbs carefully (flag gaps; don’t invent to fill them).
4. **One clear idea per video.** Never cram multiple Top 5 stories into one script.
5. **Unverified → flag or cut.** Anything not clearly in the source: `[UNVERIFIED — confirm before posting]`. Final hybrid must have **zero** such flags.
6. **Do not drop load-bearing source facts.** If the source has ₹ amounts, deadlines, percentages, places, or key names, they must appear in the final hybrid (and preferably in variations) unless the user asks to shorten. Personal-stake framing (“this changes your commute”) is allowed only when the source supports that stake — never invent a personal angle the article doesn’t support.
7. **Save under** `work/<DD-Mon-YYYY>/Coastal_Katte/scripts/` — never only in chat.

## Step 1 — Resolve which story

Accept **either**:

| Mode | User says (examples) | What you do |
|:-----|:---------------------|:------------|
| Top 5 rank + date | “Script #2 from 30-Aug-2026” / “Coastal Katte top 5 item 1 for today” | Load `work/<date>/Coastal_Katte/CoastalKatte_Top5_<date>.json` → that `rank` |
| Headline / free pick | Headline text, or “script the Plastic Park story” | Find best match in that day’s CoastalKatte Top 5, else LocalTop5, else PageDigests under `work/<date>/` |
| Pasted full article | User pastes body (and optional headline) | Use paste as source of truth; still record date + headline in metadata |

If date is omitted, use the most recent `work/*/Coastal_Katte/CoastalKatte_Top5_*.json`, or ask once.

**Source priority (highest first):**

1. Full article text pasted by the user (or a file path they give to full text)
2. Coastal Katte Top 5 item (headline + blurb + sources)
3. Matching LocalTop5 / PageDigest article record

When using (2) or (3) only, say in the script file header: `Source depth: digest-blurb` so the user knows denser facts may be missing. Offer to accept a full paste for a richer rewrite.

If a brand/sponsor is named in the user brief → **HCAC**. Otherwise → **HCC**.

## Step 2 — Write (all 4 workflow steps, in order)

Follow `references/script-spec.md` exactly:

1. **Generate 3 variations** — same article, different approach:
   - A: Curiosity hook  
   - B: Question hook  
   - C: Shock-value hook  
   Each: different storytelling angle + different CTA. Label timings (HCC or HCAC). **BODY must be 3–5 short bullet points** (one fact per line), not paragraphs.
2. **Verify** — line-by-line vs source; flag unverified claims.
3. **Synthesize** — one final hybrid (best hook + strongest body + best CTA). **Zero** `[UNVERIFIED]` left.
4. **Report** — short verification summary.

Writing rules: see `references/writing-rules.md` (rupee figures, personal stake, no jargon, etc.).

## Step 3 — Save outputs

```
work/<DD-Mon-YYYY>/Coastal_Katte/scripts/
  <slug>_script.md          # required — all 3 variations + final + report
```

Markdown only — do **not** write a JSON sidecar.

`<slug>` = short kebab from headline (e.g. `plastic-park-ganjimutt`). If collision, append `-2`.

Also give a short chat reply: which story, HCC vs HCAC, path to the MD file. Do **not** dump all three full scripts into chat unless asked — point to the file.

## Quality checklist

- [ ] Source resolved and stated (paste vs Top5 rank vs headline match)
- [ ] HCC or HCAC chosen correctly (sponsor check)
- [ ] 3 variations + final hybrid + verification report in the MD
- [ ] BODY sections use 3–5 short bullets (not paragraphs)
- [ ] Final hybrid has no `[UNVERIFIED]` flags
- [ ] MD only under `work/<date>/Coastal_Katte/scripts/` (no JSON)

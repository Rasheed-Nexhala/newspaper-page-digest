# Coastal Katte YouTube Top 5 — format spec

Markdown only. One file per day.

If the user provides a SCRIPT MD (paste or path), map that file’s headings onto this output. Do not ignore their template.

## Path

```
work/<DD-Mon-YYYY>/Coastal_Katte/youtube/CoastalKatte_YT_Top5_<DD-Mon-YYYY>.md
```

## File template

```markdown
# Coastal Katte YouTube — Top 5 — <DD Mon YYYY>
**Date:** <Day, DD Month YYYY>  
**Channel:** @coastal_katte  
**Length target:** 4–6 minutes  
**Input:** CoastalKatte_Top5_<DD-Mon-YYYY>.json  
**Order:** rank 1 → 5  
**Sponsor:** none

---

## YouTube packaging

### Title options
1. …
2. …
3. …

### Description
…

### Timestamps
0:00 …
0:XX Number 1 — <short title>
…

### Thumbnail text
…

### Thumbnail prompt
YouTube 16:9 thumbnail. Foreground: host photo (Shaz / Coastal Katte) looking at camera. Background: stills or a simple prop tied to the day’s lead story (e.g. highway, park sign, court) — no fake headlines, no unsourced numbers. Style: clean, readable, local-news, not clickbait gore. Include tiny Coastal Katte wordmark only if it stays readable.

---

## Alternate cold opens
**A:** …
**B:** …
**C:** …

---

## Story notes (not for camera)

| Rank | Headline | source_depth | Load-bearing facts |
|:-----|:---------|:-------------|:-------------------|
| 1 | … | digest-blurb / full-article | … |

Keep beat scaffolding / `source_depth` / fact checklists here only. Never put those inside Teleprompter.

---

## Teleprompter

### INTRO

Let’s talk about today’s Top 5 news from <geography line>.

<one sentence listing the five topics in order, titles only, no extra facts>

---

### NUMBER 1 — <headline>

Number one. <spoken what happened + numbers/dates + why it matters>

**Host take**

<1–2 spoken sentences; or omit this side heading + lines if nothing safe>

---

### NUMBER 2 — <headline>
…
### NUMBER 3 — <headline>
### NUMBER 4 — <headline>
### NUMBER 5 — <headline>

---

### CLOSE

So that’s today’s five: <sourced one-line recap>.

Comment which story hit you hardest. Subscribe for tomorrow’s Top 5 from Coastal Katte.

---

## Verification report
- Claims checked: N
- Flagged: …
- Resolved: …
```

## Teleprompter rules (hard)

- **Spoken body only** under each heading. No `source_depth`, no tables, no verification notes, no production beat labels like `**What happened:**` / `**Numbers / dates:**` / `**Why it matters:**`.
- **Always show topic separation.** Use `### INTRO`, `### NUMBER 1 — <headline>` … `### NUMBER 5 — <headline>`, `### CLOSE`, with a horizontal rule `---` between each topic.
- **Always highlight headings / side headings.** Topic titles are `###` headings. Host opinion uses bold side heading `**Host take**` on its own line, then the spoken lines below.
- Packaging, cold opens, story notes, and verification stay **outside** Teleprompter.

## Writing

- Simple English. Short sentences you can say on camera.
- One idea per sentence. No journalist-speak (“developments unfolded”, “the matter pertains”).
- Explain so a viewer who did not read the paper still understands **what happened**.
- Do not cram Instagram-style 6-word hooks into story bodies.
- Title/description/thumbnail text: only words supported by the five sources.

## HOST TAKE rules

- In Teleprompter, use bold side heading `**Host take**` on its own line, then spoken sentences below (easy to scan; host still says the take aloud).
- Allowed without user notes: restating sourced daily-life stake (“October-end is the date they set for inauguration”).
- Not allowed unless the user wrote it: accusations, predictions, “they must resign”, unsourced motives.
- If there is nothing safe to add, omit the `**Host take**` block for that story (do not write `Host take: (skip)` on camera).

## Geography line examples

- `Mangaluru`
- `Mangaluru and coastal Karnataka`
- `Mangaluru, coastal Karnataka, and Karnataka`

Build from the five items’ `scope` fields only.

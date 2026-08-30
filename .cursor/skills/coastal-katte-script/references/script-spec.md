# Coastal Katte Script — format spec

## Step 0 — Sponsor check

- Brand/sponsor in the brief → **HCAC**
- Otherwise → **HCC**

## HCC structure (50–60 sec, no sponsor)

| Beat | Timing | Notes |
|:-----|:-------|:------|
| HOOK | 0–3s | Max **6 words** — curiosity, question, or shock |
| INTRODUCTION | 3–10s | Setup + why it matters to the viewer personally |
| BODY | 10–50s | **3–5 short bullet points** (one fact/line); one clear idea |
| CONCLUSION / CTA | 50–60s | Memorable takeaway + specific save/share/comment prompt |

## HCAC structure (~65 sec, with sponsor)

| Beat | Timing | Notes |
|:-----|:-------|:------|
| HOOK | 0–3s | Max 6 words |
| INTRODUCTION | 3–10s | Setup + personal stake |
| BODY PART 1 | 10–35s | 2 short bullet points |
| AD BREAK | 35–50s | ~15s / 30–35 words: natural bridge → what brand offers + why this audience cares → one clear action |
| BODY PART 2 + CTA | 50–65s | Punchline point + takeaway + CTA |

## Markdown file template

```markdown
# Coastal Katte Script — <Headline>
**Date:** <Day, DD Month YYYY>  
**Channel:** @coastal_katte  
**Format:** HCC | HCAC  
**Source depth:** full-article | digest-blurb  
**Picked via:** top5-rank:<n> | headline | paste  
**Source ref:** <path or "user paste">

---

## Variation A — Curiosity hook

### HOOK (0–3s)
…

### INTRODUCTION (3–10s)
…

### BODY (10–50s)   # or BODY PART 1 / AD BREAK / BODY PART 2 for HCAC
- Short fact 1
- Short fact 2
- Short fact 3
(3–5 bullets; one line each — no long paragraphs)

### CONCLUSION / CTA (50–60s)
…

---

## Variation B — Question hook
…same beat labels…

---

## Variation C — Shock-value hook
…same beat labels…

---

## Final hybrid script (verified)

### HOOK (0–3s)
…

### INTRODUCTION (3–10s)
…

### BODY …
…

### CONCLUSION / CTA …
…

**(Full spoken script, continuous — optional clean block for Teleprompter)**

> …

---

## Verification report

- Claims checked: N
- Flagged: …
- Resolved: cut / confirmed in source …
```

## Output file

Save only:

`work/<DD-Mon-YYYY>/Coastal_Katte/scripts/<slug>_script.md`

Do **not** write a JSON sidecar. Metadata lives in the MD header (`Date`, `Format`, `Source depth`, `Picked via`, `Source ref`).

## Chat delivery

Short only: story title, format, source depth, path to `*_script.md`. Full scripts live in the file.

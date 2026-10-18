# Agent rules (newspaper-page-digest)

Repository-wide rules for Cursor agents, sub-agents, and daily pipelines. **Skills and slash commands are authoritative for step-by-step workflow**; this file states non-negotiable quality gates that apply to every run.

## Incident: fabricated News Trail digests (Oct 2026)

Published PageDigests and Top 5 for **15 Oct** and **17 Oct 2026** included stories that were **not on the PDFs** (e.g. D'Souza MCC inquiry, Vande Bharat, Bantwal Smart Town, KSPCB lakes; 15 Oct CBI / $20B / acid attack). Real **17 Oct** News Trail included e.g. p1 **SILENCED**, p2 **Blot on friendship**, p10 **Entertainment** — not the invented set. Some outputs also used the **wrong weekday** (Friday vs Saturday).

**Root cause:** News Trail PDFs are **scanned images** with no usable text layer. When text extraction returned nothing, workers **invented plausible local news and page numbers** instead of using vision/OCR on rendered page images or stopping with “page unreadable.”

Brief reference: `docs/incidents/2026-10-18-nt-fabricated-digests.md`.

## Permanent rules (never waive)

1. **Never invent, infer, or fill in** a story, number, name, quote, date, or weekday. Every digest item must come from text you actually read: PDF text layer, or OCR/vision on the rendered page image.
2. If a PDF page has **no or too little text**, render to image and read with OCR/vision. If still unreadable, write **“page unreadable”** for that page. **Never fill it in.**
3. Each **Top 5 citation** (`paper` + `page`) must be checked against that **page image** before publish (**Gate A** and **Gate B**). Mandatory and blocking for **every paper** (Deccan Herald, The Hindu, News Trail), **every day**.
4. **Gate B is mechanical:** run `.cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py` before merge; paste full stdout into the PR. Exit non-zero or missing script output ⇒ **do not merge**. Verbal “I checked” is not a pass. (PDFs are usually not in-repo — agents run locally with `--pdf-dir` / `--pdf`; CI skips when PDFs are absent and that skip is **not** a pass.)
5. **Compute weekdays from the date.** Never guess them.
6. If **any gate fails**, do **not** merge or deploy. Report the failure instead.
7. **Log each day’s verification evidence** (Gate B script output; page image checked, headline seen) in the **PR description**.

## Where rules are enforced in-repo

| Location | Purpose |
|:---------|:--------|
| `.cursor/rules/newspaper-digest-no-invent.mdc` | Cursor project rule (always on for this repo) |
| `.cursor/skills/daily-local-coastal-top5/SKILL.md` | Preferred daily pipeline + Gate A/B |
| `.cursor/skills/daily-local-coastal-top5/references/page-image-verification-gate.md` | Gate A/B procedure |
| `.cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py` | **Mechanical Gate B** — OCR/text-layer citation check; exit non-zero on miss |
| `.cursor/skills/daily-local-coastal-top5/scripts/README-gate-b.md` | How to run Gate B + CI notes |
| `.github/workflows/gate-b-check.yml` | Optional CI when `GATE_B_PDF_DIR` has PDFs |
| `.cursor/skills/newspaper-page-digest/SKILL.md` | Per-paper digest + Gate A |
| `.cursor/commands/daily-local-coastal-top5.md` | Slash command summary |

## Daily pack default

Preferred pack: **`daily-local-coastal-top5`** — digest → Local Top 5 → Coastal Katte Top 5 → **`gate_b_check.py`** → UI verify → land on `main` (Firebase Hosting). Do not skip Gate A or Gate B.

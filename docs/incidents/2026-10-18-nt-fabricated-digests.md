# Fabricated News Trail digests (15 & 17 Oct 2026)

**Owner:** Shaz Rasheed  
**Status:** Guardrails encoded in repo (Oct 2026)

## What happened

- **15 Oct** and **17 Oct** published `NewsTrail_*_PageDigest` and downstream **Local Top 5** / **Coastal Katte Top 5** contained fabricated stories and wrong page citations.
- Examples of invented content: D'Souza MCC inquiry, Vande Bharat, Bantwal Smart Town, KSPCB lakes; 15 Oct CBI / $20B / acid attack narratives.
- **17 Oct** actual News Trail (vision on PDF): e.g. page 1 **SILENCED**, page 2 **Blot on friendship**, page 10 **Entertainment** — not the published invented set.
- Some metadata used the **wrong weekday** (Friday vs Saturday).

## Root cause

News Trail Mangaluru editions are **image scans** without a reliable text layer. When extraction returned empty or thin text, agents **hallucinated plausible Mangaluru headlines** and page numbers instead of:

- rendering each page and reading with **vision/OCR**, or
- marking the page **unreadable** and stopping publish.

## Prevention (durable)

See `AGENTS.md` and `.cursor/rules/newspaper-digest-no-invent.mdc`. Operational gates: **Gate A** (per-paper digest) and **Gate B** (every Top 5 citation) in `.cursor/skills/daily-local-coastal-top5/references/page-image-verification-gate.md`.

**Gate B must be mechanical:** run `.cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py` before merge and paste stdout into the PR. Procedure-only / verbal QA was insufficient — **14 Oct** still shipped fabricated News Trail Top 5 items after “QA.” No script output ⇒ do not merge. CI may run the same script when PDFs are available (`GATE_B_PDF_DIR`); otherwise agents run locally (PDFs are not in-repo).

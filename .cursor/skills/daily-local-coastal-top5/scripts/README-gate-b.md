# Gate B mechanical checker

**Script:** `gate_b_check.py`  
**Purpose:** Fail-closed verification that every Local Top 5 / Coastal Katte Top 5 citation (`paper` + `page` + headline) actually appears on that page (PDF text layer or OCR of the rendered page image).

## Why this exists

PR #14 / #15 added Gate A/B as agent procedure only. **14 Oct** still shipped fabricated News Trail Top 5 items that page images did not contain. Agents saying “I checked” is not enough. This script prints per-citation evidence and exits non-zero on any miss.

## Dependencies

```bash
# System
sudo apt-get install -y tesseract-ocr poppler-utils

# Python
pip install -r .cursor/skills/daily-local-coastal-top5/scripts/requirements-gate-b.txt
# or: pip install pypdf pillow pytesseract --break-system-packages
```

## Run (agents — mandatory before merge)

From the repo root, with edition PDFs available locally (they are **not** committed):

```bash
python3 .cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py \
  --date 14-Oct-2026 \
  --top5 work/14-Oct-2026/Daily_top/LocalTop5_14-Oct-2026.json \
  --top5 work/14-Oct-2026/Coastal_Katte/CoastalKatte_Top5_14-Oct-2026.json \
  --pdf-dir /path/to/14-Oct-2026-pdfs \
  --force-ocr
```

Prefer split pages when still present after digest:

```bash
python3 .cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py \
  --date DD-Mon-YYYY \
  --top5 work/DD-Mon-YYYY/Daily_top/LocalTop5_DD-Mon-YYYY.json \
  --top5 work/DD-Mon-YYYY/Coastal_Katte/CoastalKatte_Top5_DD-Mon-YYYY.json \
  --work-dir work/DD-Mon-YYYY \
  --pdf-dir /path/to/edition-pdfs
```

Explicit paper paths:

```bash
python3 .cursor/skills/daily-local-coastal-top5/scripts/gate_b_check.py \
  --top5 work/.../LocalTop5_....json \
  --pdf "News Trail=/abs/NewsTrail.pdf" \
  --pdf "Deccan Herald=/abs/DH.pdf" \
  --pdf "The Hindu=/abs/Hindu.pdf" \
  --force-ocr
```

### Exit codes

| Code | Meaning |
|:-----|:--------|
| 0 | All citations PASS |
| 1 | One or more FAIL, or missing PDF/page (fail closed) |
| 2 | Usage / dependency / config error |

### PR evidence (required)

Paste the full script stdout (every `PASS`/`FAIL` line + `SUMMARY` / `GATE_B:`) into the PR description. **No script output ⇒ Gate B not passed ⇒ do not merge.**

Use `--force-ocr` for News Trail / scan PDFs (no reliable text layer).

## CI (optional)

Workflow `.github/workflows/gate-b-check.yml` runs when `GATE_B_PDF_DIR` (or a checked-in path) provides PDFs. Edition PDFs are normally absent from the repo, so CI **skips** with a notice rather than inventing a pass. Agents remain responsible for running locally and pasting evidence.

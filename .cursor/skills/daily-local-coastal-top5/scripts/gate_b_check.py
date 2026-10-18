#!/usr/bin/env python3
"""
Gate B — mechanical Top 5 citation checker (blocking).

Given one or more Top 5 JSON files plus paper PDFs (or already-split page
images), render each cited page, OCR it, and verify the cited headline (or a
substantial substring) appears on that page.

Exit codes:
  0  all citations PASS
  1  one or more citations FAIL (or required PDF/page missing — fail closed)
  2  usage / dependency / config error

Agents MUST run this before merge/deploy and paste the stdout evidence block
into the PR description. "I checked" without this output is not a pass.

Examples:
  python3 gate_b_check.py \\
    --date 14-Oct-2026 \\
    --top5 work/14-Oct-2026/Daily_top/LocalTop5_14-Oct-2026.json \\
    --top5 work/14-Oct-2026/Coastal_Katte/CoastalKatte_Top5_14-Oct-2026.json \\
    --pdf-dir /path/to/edition-pdfs

  python3 gate_b_check.py \\
    --top5 LocalTop5.json --top5 CoastalKatte.json \\
    --pdf "News Trail=/path/NewsTrail.pdf" \\
    --pdf "Deccan Herald=/path/DH.pdf" \\
    --pdf "The Hindu=/path/Hindu.pdf"

  # Prefer already-split pages from digest workdir when present:
  python3 gate_b_check.py --top5 LocalTop5.json --work-dir work/14-Oct-2026 \\
    --pdf-dir /path/to/edition-pdfs
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


PAPER_ALIASES: dict[str, tuple[str, ...]] = {
    "deccan herald": ("deccanherald", "deccan_herald", "dh", "deccan"),
    "the hindu": ("thehindu", "the_hindu", "hindu"),
    "news trail": ("newstrail", "news_trail", "nt"),
}

PAPER_SLUG_DIRS: dict[str, tuple[str, ...]] = {
    "deccan herald": ("Deccan_Herald", "DeccanHerald"),
    "the hindu": ("The_Hindu", "TheHindu"),
    "news trail": ("News_Trail", "NewsTrail"),
}


def die(msg: str, code: int = 2) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def normalize_text(s: str) -> str:
    """Lowercase, strip punctuation noise, collapse whitespace for matching."""
    s = s.lower()
    # Common OCR / newspaper punctuation variants
    s = s.replace("₹", "rs").replace("$", " ")
    s = s.replace("'", "'").replace("'", "'").replace(""", " ").replace(""", " ")
    s = s.replace("–", "-").replace("—", "-")
    s = re.sub(r"[^\w\s]", " ", s, flags=re.UNICODE)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def significant_tokens(headline: str, min_len: int = 4) -> list[str]:
    stop = {
        "with", "from", "that", "this", "have", "been", "will", "after",
        "over", "into", "about", "their", "they", "them", "than", "when",
        "where", "which", "while", "also", "says", "said", "amid", "near",
    }
    toks = []
    for t in normalize_text(headline).split():
        if len(t) < min_len or t in stop:
            continue
        toks.append(t)
    return toks


def headline_match(headline: str, ocr_text: str) -> tuple[bool, str]:
    """
    Return (ok, evidence). Fail closed on weak OCR: require a real substring
    or a strong multi-token hit, never a single common word.
    """
    h_norm = normalize_text(headline)
    o_norm = normalize_text(ocr_text)

    if not h_norm:
        return False, "empty_headline"

    if not o_norm.strip():
        return False, "empty_ocr"

    # 1) Full normalized headline
    if h_norm in o_norm:
        return True, f"full_headline:{h_norm[:80]}"

    # 2) Substantial contiguous substring (>= max(18, 45% of headline chars))
    min_sub = max(18, int(len(h_norm) * 0.45))
    if len(h_norm) >= min_sub:
        for length in range(len(h_norm), min_sub - 1, -1):
            for start in range(0, len(h_norm) - length + 1):
                sub = h_norm[start : start + length]
                if " " not in sub.strip():
                    continue  # avoid single-token lucky hits for long headlines
                if sub in o_norm:
                    return True, f"substring:{sub[:100]}"

    # 3) Compact in-order token windows (no bag-of-words — too many false PASSes
    # on busy newspaper pages). Require consecutive significant tokens whose
    # OCR span is tight enough to be one phrase, not scattered page noise.
    toks = significant_tokens(headline)
    if not toks:
        return False, "no_significant_tokens"

    need = 3 if len(toks) >= 3 else len(toks)
    for window in range(len(toks), need - 1, -1):
        for i in range(0, len(toks) - window + 1):
            chunk = toks[i : i + window]
            pos = 0
            starts: list[int] = []
            ends: list[int] = []
            ok = True
            for t in chunk:
                j = o_norm.find(t, pos)
                if j < 0:
                    ok = False
                    break
                starts.append(j)
                ends.append(j + len(t))
                pos = j + len(t)
            if not ok:
                continue
            span = ends[-1] - starts[0]
            joined_len = sum(len(t) for t in chunk) + (len(chunk) - 1)
            # Allow OCR gaps / line breaks, but not half the page
            max_span = max(joined_len * 3 + 24, joined_len + 40)
            if span <= max_span and window >= need:
                return True, f"token_window:{' '.join(chunk)}"

    return False, "not_found"


@dataclass
class Citation:
    file_label: str
    bucket: str
    rank: int
    headline: str
    paper: str
    page: int
    index: int | None = None


def iter_citations(path: Path) -> Iterable[Citation]:
    data = json.loads(path.read_text(encoding="utf-8"))
    label = path.name

    # Local Top 5: buckets.*.items[]
    buckets = data.get("buckets")
    if isinstance(buckets, dict):
        for bname, bucket in buckets.items():
            if not isinstance(bucket, dict):
                continue
            for item in bucket.get("items") or []:
                yield from _item_citations(label, str(bname), item)
        return

    # Coastal Katte / flat items[]
    items = data.get("items")
    if isinstance(items, list):
        for item in items:
            yield from _item_citations(label, "items", item)
        return

    die(f"Unrecognized Top5 schema in {path} (need buckets or items)")


def _item_citations(label: str, bucket: str, item: dict[str, Any]) -> Iterable[Citation]:
    if not isinstance(item, dict):
        return
    rank = int(item.get("rank") or 0)
    headline = str(item.get("headline") or "").strip()
    sources = item.get("sources")
    if not sources:
        # Fail closed: ranked item with no sources is unverifiable
        yield Citation(label, bucket, rank, headline, "", 0, None)
        return
    for src in sources:
        if not isinstance(src, dict):
            continue
        paper = str(src.get("paper") or "").strip()
        page = src.get("page")
        try:
            page_i = int(page)
        except (TypeError, ValueError):
            page_i = 0
        idx = src.get("index")
        try:
            idx_i = int(idx) if idx is not None else None
        except (TypeError, ValueError):
            idx_i = None
        yield Citation(label, bucket, rank, headline, paper, page_i, idx_i)


def paper_key(name: str) -> str:
    return normalize_text(name)


def resolve_pdf_map(pdf_args: list[str], pdf_dir: Path | None) -> dict[str, Path]:
    mapping: dict[str, Path] = {}
    for raw in pdf_args:
        if "=" not in raw:
            die(f"--pdf must be 'Paper Name=/path/file.pdf', got: {raw}")
        name, path_s = raw.split("=", 1)
        p = Path(path_s).expanduser().resolve()
        if not p.is_file():
            die(f"PDF not found for {name!r}: {p}")
        mapping[paper_key(name)] = p

    if pdf_dir is not None:
        if not pdf_dir.is_dir():
            die(f"--pdf-dir is not a directory: {pdf_dir}")
        for f in sorted(pdf_dir.iterdir()):
            if f.suffix.lower() != ".pdf":
                continue
            stem = normalize_text(f.stem).replace(" ", "")
            for canon, aliases in PAPER_ALIASES.items():
                if any(a.replace(" ", "") in stem for a in (canon.replace(" ", ""),) + aliases):
                    mapping.setdefault(canon, f.resolve())
                    break
    return mapping


def find_split_page(work_dir: Path | None, paper: str, page: int) -> Path | None:
    if work_dir is None or page < 1:
        return None
    key = paper_key(paper)
    slug_candidates = PAPER_SLUG_DIRS.get(key, ())
    # Also try any subdir name fuzzy-matching paper
    candidates: list[Path] = []
    for slug in slug_candidates:
        candidates.append(work_dir / slug / "pages")
    if work_dir.is_dir():
        for child in work_dir.iterdir():
            if not child.is_dir():
                continue
            n = normalize_text(child.name).replace(" ", "").replace("_", "")
            aliases = PAPER_ALIASES.get(key, ())
            if any(a.replace(" ", "") in n for a in (key.replace(" ", ""),) + aliases):
                candidates.append(child / "pages")

    width_guesses = (2, 3, 4)
    for pages_dir in candidates:
        if not pages_dir.is_dir():
            continue
        for w in width_guesses:
            p = pages_dir / f"page-{str(page).zfill(w)}.pdf"
            if p.is_file():
                return p
        # Also accept PNG/JPG renders
        for ext in (".png", ".jpg", ".jpeg", ".webp"):
            for w in width_guesses:
                p = pages_dir / f"page-{str(page).zfill(w)}{ext}"
                if p.is_file():
                    return p
    return None


def extract_pdf_text_layer(pdf_path: Path, page: int | None = None) -> str:
    """Try text layer via pdftotext; page is 1-based when set."""
    if not shutil.which("pdftotext"):
        return ""
    cmd = ["pdftotext", "-layout"]
    if page is not None:
        cmd += ["-f", str(page), "-l", str(page)]
    cmd += [str(pdf_path), "-"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, check=False)
        return r.stdout or ""
    except OSError:
        return ""


def render_page_png(source: Path, page: int, out_png: Path, dpi: int) -> None:
    """Render one page from a multi-page PDF, or copy/convert a single-page PDF/image."""
    suffix = source.suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        shutil.copyfile(source, out_png)
        return

    if not shutil.which("pdftoppm"):
        die("pdftoppm (poppler-utils) is required to render PDF pages")

    # Single-page PDF from split_pdf: still page 1 of that file
    # Multi-page edition PDF: use --page
    # Detect page count cheaply via pdfinfo if available
    use_page = page
    # If filename looks like page-NN.pdf, treat as single-page file
    if re.search(r"page-\d+\.pdf$", source.name, re.I):
        use_page = 1

    out_prefix = out_png.with_suffix("")  # pdftoppm adds .png
    cmd = [
        "pdftoppm",
        "-png",
        "-r",
        str(dpi),
        "-f",
        str(use_page),
        "-l",
        str(use_page),
        "-singlefile",
        str(source),
        str(out_prefix),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not out_png.is_file():
        die(
            f"pdftoppm failed for {source} page {page}: {r.stderr.strip() or r.stdout.strip()}"
        )


def ocr_image(png_path: Path) -> str:
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        die(
            "Python packages pillow and pytesseract are required. "
            "Install: pip install pillow pytesseract --break-system-packages"
        )
    if not shutil.which("tesseract"):
        die("tesseract binary not found; install tesseract-ocr")
    img = Image.open(png_path)
    # Newspaper pages are large; mild upsample helps sparse OCR
    return pytesseract.image_to_string(img) or ""


def cache_key(path: Path, page: int) -> str:
    st = path.stat()
    raw = f"{path.resolve()}|{st.st_mtime_ns}|{st.st_size}|{page}"
    return hashlib.sha1(raw.encode()).hexdigest()[:16]


def get_page_text(
    *,
    paper: str,
    page: int,
    pdf_map: dict[str, Path],
    work_dir: Path | None,
    cache_dir: Path,
    dpi: int,
    force_ocr: bool,
) -> tuple[str, str, Path | None]:
    """
    Returns (text, method, source_path).
    method: text_layer | ocr | missing
    """
    split = find_split_page(work_dir, paper, page)
    key = paper_key(paper)
    edition_pdf = pdf_map.get(key)

    source: Path | None = split or edition_pdf
    if source is None:
        return "", "missing", None

    # Prefer text layer on edition PDF or split page when rich enough
    if not force_ocr:
        if split is not None and split.suffix.lower() == ".pdf":
            layer = extract_pdf_text_layer(split, page=None)
        elif edition_pdf is not None:
            layer = extract_pdf_text_layer(edition_pdf, page=page)
        else:
            layer = ""
        # Enough letters to trust text layer (image-only PDFs often return junk)
        letters = sum(c.isalpha() for c in layer)
        if letters >= 80:
            return layer, "text_layer", source

    # OCR path
    ck = cache_key(source, page if edition_pdf and split is None else 1)
    png = cache_dir / f"{ck}.png"
    txt = cache_dir / f"{ck}.txt"
    if txt.is_file() and png.is_file():
        return txt.read_text(encoding="utf-8", errors="replace"), "ocr_cached", source

    render_page_png(source, page if split is None else 1, png, dpi=dpi)
    text = ocr_image(png)
    txt.write_text(text, encoding="utf-8")
    return text, "ocr", source


def format_evidence_line(
    *,
    status: str,
    cit: Citation,
    method: str,
    detail: str,
    source: Path | None,
    ocr_chars: int,
) -> str:
    src = str(source) if source else "NONE"
    idx = f" i{cit.index}" if cit.index is not None else ""
    return (
        f"{status}\t{cit.file_label}\t{cit.bucket}#{cit.rank}\t"
        f"{cit.paper or 'NO_PAPER'} p{cit.page}{idx}\t"
        f"method={method}\tocr_chars={ocr_chars}\t{detail}\tsource={src}"
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Gate B: OCR/text-layer check that Top 5 headlines appear on cited pages"
    )
    ap.add_argument(
        "--date",
        help="Date slug DD-Mon-YYYY (informational; also used to hint work-dir)",
    )
    ap.add_argument(
        "--top5",
        action="append",
        required=True,
        dest="top5_paths",
        help="Path to LocalTop5_*.json and/or CoastalKatte_Top5_*.json (repeatable)",
    )
    ap.add_argument(
        "--pdf",
        action="append",
        default=[],
        dest="pdfs",
        help="Paper mapping: 'News Trail=/path/file.pdf' (repeatable)",
    )
    ap.add_argument(
        "--pdf-dir",
        type=Path,
        help="Directory of edition PDFs; auto-match by filename keywords",
    )
    ap.add_argument(
        "--work-dir",
        type=Path,
        help="Digest work dir (work/<date>/) to prefer Paper_Slug/pages/page-NN.pdf",
    )
    ap.add_argument("--dpi", type=int, default=200, help="Render DPI for OCR (default 200)")
    ap.add_argument(
        "--force-ocr",
        action="store_true",
        help="Skip PDF text layer; always OCR rendered page images",
    )
    ap.add_argument(
        "--cache-dir",
        type=Path,
        help="Cache dir for rendered PNGs/OCR (default: temp under /tmp)",
    )
    ap.add_argument(
        "--json-out",
        type=Path,
        help="Optional path to write machine-readable results JSON",
    )
    args = ap.parse_args(argv)

    top5_paths = [Path(p).expanduser().resolve() for p in args.top5_paths]
    for p in top5_paths:
        if not p.is_file():
            die(f"Top5 JSON not found: {p}")

    pdf_map = resolve_pdf_map(args.pdfs, args.pdf_dir.resolve() if args.pdf_dir else None)
    work_dir = args.work_dir.resolve() if args.work_dir else None

    if not pdf_map and work_dir is None:
        die(
            "Provide --pdf / --pdf-dir and/or --work-dir with pages/. "
            "Without page sources Gate B cannot run (fail closed)."
        )

    cache_dir = args.cache_dir
    tmp: tempfile.TemporaryDirectory[str] | None = None
    if cache_dir is None:
        tmp = tempfile.TemporaryDirectory(prefix="gate_b_")
        cache_dir = Path(tmp.name)
    else:
        cache_dir.mkdir(parents=True, exist_ok=True)

    citations: list[Citation] = []
    for p in top5_paths:
        citations.extend(list(iter_citations(p)))

    if not citations:
        die("No citations found in Top5 JSON files", code=1)

    print("=== Gate B citation check ===")
    if args.date:
        print(f"date: {args.date}")
    print(f"top5_files: {', '.join(str(p) for p in top5_paths)}")
    print(f"pdfs_mapped: {', '.join(f'{k}={v}' for k, v in sorted(pdf_map.items())) or '(none)'}")
    print(f"work_dir: {work_dir or '(none)'}")
    print(f"force_ocr: {bool(args.force_ocr)}")
    print("---")

    results: list[dict[str, Any]] = []
    fails = 0

    # Deduplicate identical paper+page OCR work within the run via cache_dir
    for cit in citations:
        if not cit.paper or cit.page < 1:
            detail = "missing_paper_or_page"
            line = format_evidence_line(
                status="FAIL",
                cit=cit,
                method="n/a",
                detail=detail,
                source=None,
                ocr_chars=0,
            )
            print(line)
            fails += 1
            results.append(
                {
                    "status": "FAIL",
                    "citation": cit.__dict__,
                    "detail": detail,
                }
            )
            continue

        text, method, source = get_page_text(
            paper=cit.paper,
            page=cit.page,
            pdf_map=pdf_map,
            work_dir=work_dir,
            cache_dir=cache_dir,
            dpi=args.dpi,
            force_ocr=args.force_ocr,
        )
        if method == "missing" or source is None:
            detail = f"no_pdf_or_page_for_paper:{cit.paper}"
            line = format_evidence_line(
                status="FAIL",
                cit=cit,
                method="missing",
                detail=detail,
                source=None,
                ocr_chars=0,
            )
            print(line)
            fails += 1
            results.append(
                {
                    "status": "FAIL",
                    "citation": cit.__dict__,
                    "detail": detail,
                    "method": method,
                }
            )
            continue

        ok, match_detail = headline_match(cit.headline, text)
        status = "PASS" if ok else "FAIL"
        if not ok:
            fails += 1
            # Include a short OCR snippet for debugging (not the whole page)
            snippet = normalize_text(text)[:160].replace("\t", " ")
            detail = f"{match_detail}; headline={normalize_text(cit.headline)[:120]}; ocr_snip={snippet}"
        else:
            detail = match_detail

        line = format_evidence_line(
            status=status,
            cit=cit,
            method=method,
            detail=detail,
            source=source,
            ocr_chars=len(text),
        )
        print(line)
        results.append(
            {
                "status": status,
                "citation": cit.__dict__,
                "method": method,
                "detail": match_detail if ok else detail,
                "source": str(source),
                "ocr_chars": len(text),
            }
        )

    print("---")
    total = len(citations)
    passed = total - fails
    print(f"SUMMARY\tpass={passed}\tfail={fails}\ttotal={total}")
    if fails:
        print("GATE_B: FAIL — do not merge or deploy")
    else:
        print("GATE_B: PASS")

    if args.json_out:
        args.json_out.write_text(
            json.dumps(
                {
                    "date": args.date,
                    "pass": fails == 0,
                    "passed": passed,
                    "failed": fails,
                    "total": total,
                    "results": results,
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    if tmp is not None:
        tmp.cleanup()

    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

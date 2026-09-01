#!/usr/bin/env python3
"""Collect Full Paper candidates from a day's PageDigest JSON files.

Tags each article with section: news | technology | opinion.

Usage:
  python3 collect_full_candidates.py --work <workspace>/work --date 31-Aug-2026 \\
    --out work/31-Aug-2026/Full_paper/candidates.json
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

SKIP_DIR_NAMES = {"Daily_top", "Coastal_Katte", "Full_paper"}

NEWS_SCOPES = (
    "mangaluru",
    "coastal_karnataka",
    "karnataka",
    "india",
    "international",
    "sports",
    "lifestyle",
    "other",
)

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

OPINION_HEADLINE = re.compile(
    r"\b(faq|f\.?a\.?q\.?|q\s*&\s*a|q and a|explainer|in focus|op-?ed|"
    r"editorial|letter to the editor|letters?\b|what is\b|why does\b|how does\b)\b",
    re.I,
)

# Core tech/science: OK in headline or blurb.
TECH_CORE = re.compile(
    r"("
    r"artificial intelligence|machine learning|chatgpt|openai|"
    r"\bISRO\b|\bNASA\b|satellite|space weather|solar flare|aditya-?l1|"
    r"semiconductor|microchip|\b5G\b|\b6G\b|smartphone|"
    r"cyber(?:space|security|attack|crime)|ransomware|malware|"
    r"algorithm|quantum (?:comput|tech|physic)|"
    r"information technology|computer science|"
    r"technology-based|space mission|space agency|"
    r"conversational AI|e-scooter|electrochem|"
    r"telescope|astronom|lunar orbit|"
    r"indian standard time|common time reference"
    r")",
    re.I,
)

# Only if the headline is about the company/product — incidental blurb mentions do not count.
TECH_HEADLINE = re.compile(
    r"("
    r"\bAI\b|artificial intelligence|"
    r"\bMeta\b|Facebook|Instagram|YouTube|TikTok|"
    r"\bISRO\b|satellite|cybercrime|telescope|e-scooter"
    r")",
    re.I,
)

WEAK_TECH_SKIP = re.compile(
    r"college of (?:medical )?science|health science|social science|"
    r"political science|bachelor of science|faculty of science",
    re.I,
)


def parse_date(text: str) -> datetime | None:
    if not text:
        return None
    s = text.strip()
    s = re.sub(r"^[A-Za-z]+,\s*", "", s)
    m = re.search(r"(\d{1,2})[-\s]+([A-Za-z]+)[-\s]+(\d{4})", s)
    if m:
        day = int(m.group(1))
        mon = MONTHS.get(m.group(2).lower())
        year = int(m.group(3))
        if mon:
            return datetime(year, mon, day)
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def date_slug(dt: datetime) -> str:
    return dt.strftime("%d-%b-%Y")


def classify_section(kind: str, headline: str, blurb: str) -> str:
    k = (kind or "news").strip().lower()
    text = f"{headline}\n{blurb}"
    if k == "opinion" or OPINION_HEADLINE.search(headline or ""):
        return "opinion"
    if WEAK_TECH_SKIP.search(text):
        return "news"
    if TECH_HEADLINE.search(headline or "") or TECH_CORE.search(text):
        return "technology"
    return "news"


def load_digests(work: Path, slug: str) -> list[tuple[Path, dict]]:
    out: list[tuple[Path, dict]] = []
    day_dir = work / slug
    search_roots = [day_dir] if day_dir.is_dir() else [work]
    for root in search_roots:
        for path in sorted(root.rglob("*_PageDigest.json")):
            if any(part in SKIP_DIR_NAMES for part in path.parts):
                continue
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if not isinstance(data, dict) or "articles" not in data:
                continue
            out.append((path, data))
    return out


def article_record(paper: str, edition: str, path: Path, art: dict) -> dict:
    headline = art.get("headline") or ""
    blurb = art.get("blurb") or ""
    kind = art.get("kind") or "news"
    scope = (art.get("scope") or "other").strip().lower()
    if scope not in NEWS_SCOPES:
        scope = "other"
    section = classify_section(kind, headline, blurb)
    return {
        "paper": paper,
        "edition": edition,
        "page": art.get("page"),
        "index": art.get("index"),
        "kind": kind,
        "scope": scope,
        "section": section,
        "headline": headline,
        "blurb": blurb,
        "source_path": str(path),
    }


def collect(work: Path, slug: str, target: datetime) -> dict:
    papers = []
    candidates = []
    for path, data in load_digests(work, slug):
        dig_date = parse_date(str(data.get("date", "")))
        if dig_date is not None and dig_date.date() != target.date():
            continue
        if dig_date is None and slug not in path.parts:
            continue
        paper = data.get("paper") or ""
        edition = data.get("edition") or ""
        try:
            rel = str(path.relative_to(work))
            stored = f"work/{rel}"
        except ValueError:
            stored = str(path)
        papers.append(
            {
                "paper": paper,
                "edition": edition,
                "path": stored,
                "total_articles": data.get("total_articles"),
            }
        )
        for art in data.get("articles") or []:
            candidates.append(article_record(paper, edition, path, art))

    sections = {"news": [], "technology": [], "opinion": []}
    for rec in candidates:
        sections[rec["section"]].append(rec)

    display_date = None
    for _path, data in load_digests(work, slug):
        if data.get("date"):
            display_date = data["date"]
            break

    return {
        "date": display_date or target.strftime("%d %B %Y"),
        "date_slug": slug,
        "papers_scanned": papers,
        "source_articles": len(candidates),
        "sections": {
            key: {"candidate_count": len(items), "candidates": items}
            for key, items in sections.items()
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--work", required=True, type=Path)
    ap.add_argument("--date", required=True)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    target = parse_date(args.date)
    if not target:
        raise SystemExit(f"Could not parse --date: {args.date!r}")

    work = args.work.resolve()
    if not work.is_dir():
        raise SystemExit(f"Not a directory: {work}")

    payload = collect(work, date_slug(target), target)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "date_slug": payload["date_slug"],
                "papers": len(payload["papers_scanned"]),
                "source_articles": payload["source_articles"],
                "counts": {
                    k: v["candidate_count"] for k, v in payload["sections"].items()
                },
                "out": str(args.out),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Collect Top-5 bucket articles from day's digests.

Scopes: mangaluru, coastal_karnataka, karnataka, india, international, sports.

Usage:
  python3 collect_local_candidates.py --work <workspace>/work --date 30-Aug-2026 \\
    --out work/30-Aug-2026/Daily_top/candidates.json
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

SCOPES = (
    "mangaluru",
    "coastal_karnataka",
    "karnataka",
    "india",
    "international",
    "sports",
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


def parse_date(text: str) -> datetime | None:
    """Parse digest date strings into a date (time zeroed)."""
    if not text:
        return None
    s = text.strip()
    # Strip weekday prefix: "Sunday, 30 August 2026"
    s = re.sub(r"^[A-Za-z]+,\s*", "", s)
    # 30-Aug-2026 / 30 Aug 2026 / 30 August 2026
    m = re.search(
        r"(\d{1,2})[-\s]+([A-Za-z]+)[-\s]+(\d{4})",
        s,
    )
    if m:
        day = int(m.group(1))
        mon = MONTHS.get(m.group(2).lower())
        year = int(m.group(3))
        if mon:
            return datetime(year, mon, day)
    # ISO-ish 2026-08-30
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None


def date_slug(dt: datetime) -> str:
    return dt.strftime("%d-%b-%Y")


def load_digests(work: Path, date_slug: str) -> list[tuple[Path, dict]]:
    """Load PageDigest JSONs under work/<date_slug>/<Paper>/ (skip Daily_top)."""
    out = []
    day_dir = work / date_slug
    search_roots = [day_dir] if day_dir.is_dir() else [work]
    for root in search_roots:
        for path in sorted(root.rglob("*_PageDigest.json")):
            if "LocalTop5_" in path.name:
                continue
            if "Daily_top" in path.parts:
                continue
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if not isinstance(data, dict) or "articles" not in data:
                continue
            out.append((path, data))
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--work", required=True, type=Path, help="Workspace work/ directory")
    ap.add_argument(
        "--date",
        required=True,
        help="Target day, e.g. 30-Aug-2026 or 'Sunday, 30 August 2026'",
    )
    ap.add_argument("--out", required=True, type=Path, help="Output candidates.json path")
    args = ap.parse_args()

    target = parse_date(args.date)
    if not target:
        raise SystemExit(f"Could not parse --date: {args.date!r}")

    work = args.work.resolve()
    if not work.is_dir():
        raise SystemExit(f"Not a directory: {work}")

    papers = []
    buckets = {s: [] for s in SCOPES}
    slug = date_slug(target)

    for path, data in load_digests(work, slug):
        dig_date = parse_date(str(data.get("date", "")))
        # Prefer folder date; also accept matching JSON date when scanning flat legacy layouts
        if dig_date is not None and dig_date.date() != target.date():
            continue
        if dig_date is None and slug not in path.parts:
            continue
        paper = data.get("paper") or ""
        edition = data.get("edition") or ""
        papers.append(
            {
                "paper": paper,
                "edition": edition,
                "path": str(path),
                "total_articles": data.get("total_articles"),
            }
        )
        for art in data.get("articles") or []:
            scope = (art.get("scope") or "").strip().lower()
            if scope not in buckets:
                continue
            buckets[scope].append(
                {
                    "paper": paper,
                    "edition": edition,
                    "page": art.get("page"),
                    "index": art.get("index"),
                    "kind": art.get("kind") or "news",
                    "scope": scope,
                    "headline": art.get("headline") or "",
                    "blurb": art.get("blurb") or "",
                    "source_path": str(path),
                }
            )

    payload = {
        "date": target.strftime("%d %B %Y"),
        "date_slug": slug,
        "papers_scanned": papers,
        "buckets": {
            s: {"candidate_count": len(buckets[s]), "candidates": buckets[s]}
            for s in SCOPES
        },
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "date_slug": payload["date_slug"],
        "papers": len(papers),
        "counts": {s: len(buckets[s]) for s in SCOPES},
        "out": str(args.out),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

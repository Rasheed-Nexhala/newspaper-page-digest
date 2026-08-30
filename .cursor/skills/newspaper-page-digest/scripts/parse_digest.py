#!/usr/bin/env python3
"""
Parse a newspaper page digest into article records.

Usage:
    python3 parse_digest.py <digest.json|digest.md>

Prints JSON to stdout: {"paper", "edition", "date", "articles": [...]}
Prefers the .json sidecar. Markdown is split only on
    <!-- npd:article ... --> / <!-- /npd:article --> sentinels.
"""
import json
import re
import sys
from pathlib import Path

VALID_SCOPES = frozenset(
    {
        "mangaluru",
        "coastal_karnataka",
        "karnataka",
        "india",
        "international",
        "sports",
        "lifestyle",
        "other",
    }
)

OPEN_RE = re.compile(
    r'<!--\s*npd:article\s+'
    r'page="(\d+)"\s+'
    r'index="(\d+)"\s+'
    r'kind="(news|opinion)"\s*'
    r'(?:scope="([^"]+)"\s*)?'
    r'-->',
    re.IGNORECASE,
)
CLOSE_TAG = "<!-- /npd:article -->"
HEADLINE_RE = re.compile(r"^###\s+(.*)\s*$")
HEADER_RE = re.compile(
    r"^#\s+(.*?)\s+[—-]\s+(.*?)\s+[—-]\s+Page-by-Page Digest\s*$"
)
DATE_RE = re.compile(r"\*\*Date:\*\*\s*([^|]+)")


def normalize_scope(raw):
    if not raw:
        return "other"
    s = raw.strip().lower().replace(" ", "_").replace("-", "_")
    return s if s in VALID_SCOPES else "other"


def parse_json_file(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if "articles" not in data or not isinstance(data["articles"], list):
        raise ValueError(f"{path} has no articles array")
    for art in data["articles"]:
        art["scope"] = normalize_scope(art.get("scope"))
    return data


def parse_markdown(text: str) -> dict:
    header = {"paper": "", "edition": "", "date": ""}
    for line in text.splitlines():
        m = HEADER_RE.match(line.strip())
        if m:
            header["paper"] = m.group(1).strip()
            header["edition"] = m.group(2).strip()
        dm = DATE_RE.search(line)
        if dm:
            header["date"] = dm.group(1).strip()

    articles = []
    pos = 0
    while True:
        open_m = OPEN_RE.search(text, pos)
        if not open_m:
            break
        close_i = text.find(CLOSE_TAG, open_m.end())
        if close_i < 0:
            raise ValueError(
                f"Unclosed article at page={open_m.group(1)} index={open_m.group(2)}"
            )
        body = text[open_m.end() : close_i].strip()
        lines = body.splitlines()
        if not lines:
            raise ValueError("Empty article block")
        hm = HEADLINE_RE.match(lines[0])
        if not hm:
            raise ValueError(f"Article block missing ### headline: {lines[0]!r}")
        blurb = "\n".join(lines[1:]).strip()
        articles.append(
            {
                "page": int(open_m.group(1)),
                "index": int(open_m.group(2)),
                "kind": open_m.group(3).lower(),
                "scope": normalize_scope(open_m.group(4)),
                "headline": hm.group(1).strip(),
                "blurb": blurb,
            }
        )
        pos = close_i + len(CLOSE_TAG)

    return {
        "paper": header["paper"],
        "edition": header["edition"],
        "date": header["date"],
        "total_articles": len(articles),
        "articles": articles,
    }


def load_digest(path: Path) -> dict:
    if path.suffix.lower() == ".json":
        return parse_json_file(path)
    if path.suffix.lower() == ".md":
        sibling = path.with_suffix(".json")
        if sibling.is_file():
            return parse_json_file(sibling)
        return parse_markdown(path.read_text(encoding="utf-8"))
    raise ValueError("Pass a .json or .md digest file")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 parse_digest.py <digest.json|digest.md>", file=sys.stderr)
        sys.exit(1)
    target = Path(sys.argv[1])
    if not target.is_file():
        print(f"File not found: {target}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(load_digest(target), indent=2, ensure_ascii=False))

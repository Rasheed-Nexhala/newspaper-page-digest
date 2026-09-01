#!/usr/bin/env python3
"""Cluster Full Paper candidates and write FullPaper MD + JSON.

Produces a faithful first draft from digest blurbs (no new facts).
The skill owner should still tighten generic purpose/gist lines.

Usage:
  python3 assemble_full_paper.py --work <workspace>/work --date 31-Aug-2026 \\
    --out-dir work/31-Aug-2026/Full_paper
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

NEWS_BUCKETS = (
    "mangaluru",
    "coastal_karnataka",
    "karnataka",
    "india",
    "international",
    "sports",
    "lifestyle",
    "other",
)

BUCKET_LABELS = {
    "mangaluru": "Mangaluru",
    "coastal_karnataka": "Coastal Karnataka",
    "karnataka": "Karnataka",
    "india": "India",
    "international": "International",
    "sports": "Sports",
    "lifestyle": "Lifestyle",
    "other": "Other",
}

STOP = {
    "the", "a", "an", "in", "of", "to", "for", "and", "on", "as", "by", "from",
    "after", "over", "with", "at", "is", "are", "was", "were", "be", "its",
    "his", "her", "their", "this", "that", "into", "amid", "says", "said",
    "will", "not", "no", "vs", "against", "new", "over",
}

TECH_RANK_WORDS = (
    "isro", "ai", "artificial intelligence", "satellite", "solar flare",
    "semiconductor", "cyber", "meta", "quantum", "aditya", "space",
    "digital", "telecom", "algorithm", "scientist",
)


def load_collect_module() -> object:
    here = Path(__file__).resolve().parent
    path = here / "collect_full_candidates.py"
    spec = importlib.util.spec_from_file_location("collect_full_candidates", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules["collect_full_candidates"] = mod
    spec.loader.exec_module(mod)
    return mod


def tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in STOP}


def similar(a: dict, b: dict) -> bool:
    ha, hb = a["headline"], b["headline"]
    ta, tb = tokenize(ha), tokenize(hb)
    if not ta or not tb:
        return False
    inter = len(ta & tb)
    jacc = inter / len(ta | tb)
    if jacc >= 0.42:
        return True
    if ta <= tb or tb <= ta:
        return True
    ba, bb = tokenize((a.get("blurb") or "")[:220]), tokenize((b.get("blurb") or "")[:220])
    combo = (ta | ba) & (tb | bb)
    if len(ta & tb) >= 3 and len(combo) >= 6:
        return True
    # Same feature (e.g. Mann Ki Baat) told under different headlines
    if len(ba & bb) >= 10 and len(ta & tb) >= 1:
        return True
    return False


def cluster_records(records: list[dict]) -> list[list[dict]]:
    clusters: list[list[dict]] = []
    for rec in records:
        placed = False
        for cluster in clusters:
            if any(similar(rec, existing) for existing in cluster):
                cluster.append(rec)
                placed = True
                break
        if not placed:
            clusters.append([rec])
    return clusters


def split_sentences(text: str) -> list[str]:
    raw = (text or "").strip()
    if not raw:
        return []
    parts = re.split(r"(?<=[.!?])\s+", raw)
    out = [p.strip() for p in parts if p.strip()]
    return out or [raw]


def split_clauses(text: str) -> list[str]:
    bits = re.split(r";\s+", text.strip())
    out: list[str] = []
    for bit in bits:
        bit = bit.strip().rstrip(".")
        if not bit:
            continue
        if len(bit) > 220:
            # further split on " and " only when already long
            chunks = re.split(r",\s+(?=[A-Z])", bit)
            out.extend(c.strip() for c in chunks if c.strip())
        else:
            out.append(bit)
    return out


def pick_base(cluster: list[dict]) -> dict:
    return max(cluster, key=lambda r: (len(r.get("blurb") or ""), -(r.get("page") or 99)))


def sources_for(cluster: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for r in sorted(cluster, key=lambda x: (str(x.get("paper")), x.get("page") or 0, x.get("index") or 0)):
        key = (r.get("paper"), r.get("edition"), r.get("page"), r.get("index"))
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "paper": r.get("paper") or "",
                "edition": r.get("edition") or "",
                "page": r.get("page") or 0,
                "index": r.get("index") or 0,
            }
        )
    return out


def format_sources(sources: list[dict]) -> str:
    return "; ".join(f"{s['paper']} {s['edition']} p.{s['page']}" for s in sources)


def news_card(cluster: list[dict]) -> dict:
    base = pick_base(cluster)
    blurb = (base.get("blurb") or "").strip()
    sents = split_sentences(blurb)
    gist = " ".join(sents[:2]) if sents else blurb
    paragraph = blurb
    rest = sents[2:] if len(sents) > 2 else []
    points: list[str] = []
    if rest:
        for s in rest:
            points.extend(split_clauses(s))
    else:
        # Pull extra clauses from a long second sentence / whole blurb
        extra = split_clauses(blurb)
        points = extra[1:6] if len(extra) > 1 else extra[:4]
    # Keep unique short points
    cleaned = []
    seen = set()
    for p in points:
        p = p.strip()
        if not p or p.lower() in seen:
            continue
        if p.lower() in gist.lower() and len(points) > 2:
            continue
        seen.add(p.lower())
        cleaned.append(p if p.endswith(".") else p + ".")
        if len(cleaned) >= 6:
            break
    if not cleaned and sents:
        cleaned = [sents[0]]

    first = sents[0] if sents else blurb
    last = sents[-1] if sents else blurb
    purpose = last if last != first else "Reports the facts of this development as printed."
    headline = (base.get("headline") or "").strip()
    concept = headline.rstrip(".")
    if concept.lower().startswith("the "):
        concept = concept[4:]

    return {
        "headline": headline,
        "gist": gist,
        "paragraph": paragraph,
        "what_this_is": {
            "concept": concept,
            "told": first,
            "purpose": purpose,
        },
        "important_points": cleaned,
        "kind": base.get("kind") or "news",
        "scope": base.get("scope") or "other",
        "sources": sources_for(cluster),
    }


def opinion_card(cluster: list[dict]) -> dict:
    base = pick_base(cluster)
    blurb = (base.get("blurb") or "").strip()
    sents = split_sentences(blurb)
    gist = " ".join(sents[:2]) if sents else blurb
    points: list[str] = []
    for s in sents:
        points.extend(split_clauses(s))
    cleaned = []
    seen = set()
    for p in points:
        p = p.strip()
        if not p:
            continue
        key = p.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(p if p.endswith(".") else p + ".")
        if len(cleaned) >= 8:
            break
    if not cleaned:
        cleaned = [gist]
    return {
        "headline": (base.get("headline") or "").strip(),
        "gist": gist,
        "points": cleaned,
        "kind": base.get("kind") or "opinion",
        "scope": base.get("scope") or "other",
        "sources": sources_for(cluster),
    }


def tech_score(card: dict, cluster: list[dict]) -> float:
    text = f"{card['headline']} {card['paragraph']}".lower()
    score = 0.0
    papers = {s["paper"] for s in card["sources"]}
    if len(papers) > 1:
        score += 3
    page = min((r.get("page") or 99) for r in cluster)
    if page <= 6:
        score += 2
    elif page <= 12:
        score += 1
    for w in TECH_RANK_WORDS:
        if w in text:
            score += 1
    score += min(len(card["paragraph"]) / 400.0, 2.0)
    return score


def md_news_item(item: dict, heading: str) -> list[str]:
    w = item["what_this_is"]
    lines = [
        heading,
        "",
        f"**In short:** {item['gist']}",
        "",
        item["paragraph"],
        "",
        "**What this is**",
        f"- **Concept:** {w['concept']}",
        f"- **Told:** {w['told']}",
        f"- **Purpose:** {w['purpose']}",
        "",
        "**Important points**",
    ]
    for p in item["important_points"]:
        lines.append(f"- {p}")
    lines.append(f"_Sources: {format_sources(item['sources'])}_")
    lines.append("")
    return lines


def md_opinion_item(item: dict, heading: str) -> list[str]:
    lines = [
        heading,
        "",
        f"**In short:** {item['gist']}",
        "",
    ]
    for p in item["points"]:
        lines.append(f"- {p}")
    lines.append(f"_Sources: {format_sources(item['sources'])}_")
    lines.append("")
    return lines


def render_markdown(payload: dict) -> str:
    papers = "; ".join(
        f"{p['paper']} {p['edition']}" for p in payload["papers_scanned"]
    )
    lines = [
        f"# Full Paper — {payload['date_slug'].replace('-', ' ')}",
        f"**Date:** {payload['date']}  |  **Papers scanned:** {papers}",
        "",
        "---",
        "",
        "## Complete news",
        "",
    ]
    news = payload["sections"]["news"]["buckets"]
    for key in NEWS_BUCKETS:
        bucket = news[key]
        lines.append(f"### {bucket['label']}")
        lines.append("")
        if not bucket["items"]:
            lines.append("*(no stories in today's digests)*")
            lines.append("")
        else:
            for item in bucket["items"]:
                lines.extend(md_news_item(item, f"#### {item['headline']}"))
                lines.append("---")
                lines.append("")
        lines.append("")

    tech = payload["sections"]["technology"]
    lines += ["---", "", "## Technology", "", f"### {tech['top5']['label']}", ""]
    if not tech["top5"]["items"]:
        lines.append("*(no stories in today's digests)*")
        lines.append("")
    else:
        for item in tech["top5"]["items"]:
            rank = item.get("rank", 0)
            lines.extend(md_news_item(item, f"#### {rank}. {item['headline']}"))
            lines.append("---")
            lines.append("")
    lines += [f"### {tech['rest']['label']}", ""]
    if not tech["rest"]["items"]:
        lines.append("*(no stories in today's digests)*")
        lines.append("")
    else:
        for item in tech["rest"]["items"]:
            lines.extend(md_news_item(item, f"#### {item['headline']}"))
            lines.append("---")
            lines.append("")

    op = payload["sections"]["opinion"]
    lines += ["---", "", "## Opinion & Explainers", ""]
    if not op["items"]:
        lines.append("*(no stories in today's digests)*")
        lines.append("")
    else:
        for item in op["items"]:
            lines.extend(md_opinion_item(item, f"### {item['headline']}"))
            lines.append("---")
            lines.append("")

    s = payload["summary"]
    news_bits = ", ".join(
        f"{BUCKET_LABELS[k]} {news[k]['item_count']}" for k in NEWS_BUCKETS
    )
    lines += [
        "---",
        "",
        "## Summary",
        f"- Papers scanned: {papers}",
        f"- Source articles → clusters: {s['source_articles']} → {s['clusters']}",
        f"- Complete news (by bucket): {news_bits}",
        f"- Technology candidates → top 5 / rest: {s['technology_candidate_count']} → {s['technology_top5_count']} / {s['technology_rest_count']}",
        f"- Opinion & Explainers: {s['opinion_count']}",
        "",
    ]
    return "\n".join(lines)


def empty_news_buckets() -> dict:
    return {
        key: {"label": BUCKET_LABELS[key], "item_count": 0, "items": []}
        for key in NEWS_BUCKETS
    }


def assemble(payload: dict) -> dict:
    news_buckets = empty_news_buckets()
    news_clusters = cluster_records(payload["sections"]["news"]["candidates"])
    for cluster in news_clusters:
        card = news_card(cluster)
        scope = card["scope"] if card["scope"] in news_buckets else "other"
        news_buckets[scope]["items"].append(card)
    for key in NEWS_BUCKETS:
        news_buckets[key]["item_count"] = len(news_buckets[key]["items"])

    tech_clusters = cluster_records(payload["sections"]["technology"]["candidates"])
    scored = []
    for cluster in tech_clusters:
        card = news_card(cluster)
        scored.append((tech_score(card, cluster), card))
    scored.sort(key=lambda x: (-x[0], x[1]["headline"]))
    tech_cards = [c for _, c in scored]
    top5 = []
    for i, card in enumerate(tech_cards[:5], start=1):
        item = dict(card)
        item["rank"] = i
        top5.append(item)
    rest = tech_cards[5:]

    opinion_clusters = cluster_records(payload["sections"]["opinion"]["candidates"])

    def op_sort_key(cluster: list[dict]) -> tuple:
        base = pick_base(cluster)
        is_ed = 0 if re.search(r"\beditorial\b|\bop-?ed\b", base.get("headline") or "", re.I) else 1
        kind_rank = 0 if (base.get("kind") or "") == "opinion" else 1
        return (kind_rank, is_ed, base.get("page") or 99, base.get("index") or 99)

    opinion_clusters.sort(key=op_sort_key)
    opinion_items = [opinion_card(c) for c in opinion_clusters]

    cluster_total = (
        sum(b["item_count"] for b in news_buckets.values())
        + len(tech_cards)
        + len(opinion_items)
    )

    return {
        "date": payload["date"],
        "date_slug": payload["date_slug"],
        "papers_scanned": [
            {k: p[k] for k in ("paper", "edition", "path", "total_articles") if k in p}
            for p in payload["papers_scanned"]
        ],
        "summary": {
            "source_articles": payload["source_articles"],
            "clusters": cluster_total,
            "news_count": sum(b["item_count"] for b in news_buckets.values()),
            "technology_candidate_count": len(tech_cards),
            "technology_top5_count": len(top5),
            "technology_rest_count": len(rest),
            "opinion_count": len(opinion_items),
        },
        "sections": {
            "news": {"label": "Complete news", "buckets": news_buckets},
            "technology": {
                "label": "Technology",
                "top5": {
                    "label": "Top 5 — Technology",
                    "candidate_count": len(tech_cards),
                    "selected_count": len(top5),
                    "items": top5,
                },
                "rest": {
                    "label": "More technology",
                    "item_count": len(rest),
                    "items": rest,
                },
            },
            "opinion": {
                "label": "Opinion & Explainers",
                "item_count": len(opinion_items),
                "items": opinion_items,
            },
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--work", required=True, type=Path)
    ap.add_argument("--date", required=True)
    ap.add_argument("--out-dir", required=True, type=Path)
    args = ap.parse_args()

    collect_mod = load_collect_module()
    target = collect_mod.parse_date(args.date)
    if not target:
        raise SystemExit(f"Could not parse --date: {args.date!r}")
    work = args.work.resolve()
    slug = collect_mod.date_slug(target)
    raw = collect_mod.collect(work, slug, target)
    final = assemble(raw)

    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"FullPaper_{slug}.json"
    md_path = out_dir / f"FullPaper_{slug}.md"
    json_path.write_text(json.dumps(final, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md_path.write_text(render_markdown(final), encoding="utf-8")

    # Drop scratch if present
    scratch = out_dir / "candidates.json"
    if scratch.exists():
        scratch.unlink()

    print(
        json.dumps(
            {
                "date_slug": slug,
                "summary": final["summary"],
                "json": str(json_path),
                "md": str(md_path),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

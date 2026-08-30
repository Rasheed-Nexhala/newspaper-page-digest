# Lessons from daily-local-top runs

## 30 Aug 2026 (The Hindu + News Trail)

| Issue | What happened | Rule |
|:------|:--------------|:-----|
| Mis-scoped coastal candidates | Kerala MDMA / Satheesan motorcade tagged `coastal_karnataka` in a digest | Skip clear non-coastal stories when building Coastal Top 5; do not rewrite source digests mid-run unless user asks |
| Soft fillers vs civic news | Bank branch, ZEISS Vision Centre, sports-day pep talk in Mangaluru pool | Prefer civic/governance/infra/courts over commercial openings |
| Cross-paper duplicates | DIG transfer + Nagendra resignation in both papers | Merge into one item; list all `sources`; keep fuller blurb |
| Layout | Earlier drafts used `work/daily/<date>/` | Always `work/<date>/Daily_top/` beside paper folders |
| JSON drift risk | Easy to invent helper fields while ranking | Frozen schema in `output-spec.md` — never rename keys |

## Ranking signals (keep)

1. Civic / public impact  
2. Page prominence  
3. Cross-paper presence  
4. Actionability / deadlines  

## Schema

`LocalTop5_*.json` and upstream `*_PageDigest.json` schemas are frozen. See both skills' `references/output-spec.md`.

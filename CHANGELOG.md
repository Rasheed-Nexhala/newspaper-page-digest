# Changelog

## 1.4.0

- Full Paper daily reader (clustered complete news, Technology Top 5, Opinion & Explainers) via `/daily-full-paper`.
- `/daily-after-digest` runs Local Top 5, Coastal Katte Top 5, Full Paper, and the YouTube briefing after all papers are digested. Does not write reel scripts. Does not backfill older dates.
- Viewer **Full paper** tab when `Full_paper/FullPaper_*.json` exists; older days without it stay as they were.

## 1.3.0

- Added required `scope` on every article (`mangaluru` | `coastal_karnataka` | `karnataka` | `india` | `international` | `sports` | `lifestyle` | `other`) in Markdown sentinels and JSON.
- Hardened workflow after real-run failures: never attach PDFs to Task `file_attachments`; demand full transcript/sentinel text (no summary-only replies); persist `work/.../transcripts` and `edited`; pass full extractor text into editors; skip cover `SEE P N` teasers; parent validates assembly.
- Updated skill, `/digest-newspaper` command, page-extractor / news-editor agents, `output-spec.md`, and `parse_digest.py` accordingly.

## 1.2.0

- Moved skill, command, and agents into `.cursor/{skills,commands,agents}/`.
- Linked the same paths into `~/.cursor/` so they load in every chat without the plugin system.

## 1.1.0

- Each article is wrapped in `<!-- npd:article ... -->` / `<!-- /npd:article -->` sentinels, with `---` between records.
- Matching `*_PageDigest.json` sidecar for Python (`json.load`).
- Bundled `scripts/parse_digest.py` to load `.json` or split `.md` on those sentinels.

## 1.0.0

- Cursor plugin: skill, `/digest-newspaper` command, page-extractor and news-editor agents.
- Same page-split + fan-out digest workflow as the original Cowork plugin.

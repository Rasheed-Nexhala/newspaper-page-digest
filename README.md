# Newspaper Page Digest

Turns any combined, multi-page newspaper PDF into a Markdown digest (plus JSON) — page by page, with a heading and short 1–3 sentence blurb for **every article**. Also builds **daily local Top 5** and a **Coastal Katte channel Top 5**.

Installed as normal Cursor components under `.cursor/` (not as a marketplace plugin):

| Kind | Path |
|:-----|:-----|
| Skill | `.cursor/skills/newspaper-page-digest/` |
| Skill | `.cursor/skills/daily-local-top/` |
| Skill | `.cursor/skills/daily-full-paper/` |
| Skill | `.cursor/skills/daily-after-digest/` |
| Skill | `.cursor/skills/coastal-katte-top5/` |
| Skill | `.cursor/skills/coastal-katte-script/` |
| Skill | `.cursor/skills/coastal-katte-youtube/` |
| Command | `.cursor/commands/digest-newspaper.md` |
| Command | `.cursor/commands/daily-after-digest.md` |
| Command | `.cursor/commands/daily-local-top.md` |
| Command | `.cursor/commands/daily-full-paper.md` |
| Command | `.cursor/commands/coastal-katte-top5.md` |
| Command | `.cursor/commands/coastal-katte-script.md` |
| Command | `.cursor/commands/coastal-katte-youtube.md` |
| Agents | `.cursor/agents/page-extractor.md`, `.cursor/agents/news-editor.md` |

The same paths are linked into your user Cursor home so they work in **any** project:

- `~/.cursor/skills/newspaper-page-digest`
- `~/.cursor/skills/daily-local-top`
- `~/.cursor/skills/daily-full-paper`
- `~/.cursor/skills/daily-after-digest`
- `~/.cursor/skills/coastal-katte-top5`
- `~/.cursor/skills/coastal-katte-script`
- `~/.cursor/skills/coastal-katte-youtube`
- `~/.cursor/commands/digest-newspaper.md`
- `~/.cursor/commands/daily-after-digest.md`
- `~/.cursor/commands/daily-local-top.md`
- `~/.cursor/commands/daily-full-paper.md`
- `~/.cursor/commands/coastal-katte-top5.md`
- `~/.cursor/commands/coastal-katte-script.md`
- `~/.cursor/commands/coastal-katte-youtube.md`
- `~/.cursor/agents/page-extractor.md`
- `~/.cursor/agents/news-editor.md`

## Work layout

```
work/<DD-Mon-YYYY>/
  The_Hindu/          # that paper's *_PageDigest.md + .json
  News_Trail/
  <Any_Other_Paper>/
  Daily_top/          # LocalTop5_*.md + .json
  Full_paper/         # FullPaper_*.md + .json (complete day reader; from /daily-after-digest)
  Coastal_Katte/      # CoastalKatte_Top5_*.md + .json (@coastal_katte)
    scripts/          # reel scripts
    youtube/          # CoastalKatte_YT_Top5_*.md (4–6 min briefing)
```

## How it works

1. Splits the PDF into individual page PDFs (`pypdf`) under `work/<date>/<Paper>/`.
2. One extractor agent per page → transcript (via **Read** on the page path — PDFs cannot be Task attachments).
3. One news-editor agent per page → heading + blurb + `scope` per article.
4. Writes `*_PageDigest.md` and `*_PageDigest.json` into the paper folder, then deletes intermediates so only those two files remain.

Each article’s `scope` is one of: `mangaluru`, `coastal_karnataka`, `karnataka`, `india`, `international`, `sports`, `lifestyle`, `other`.

### Daily local Top 5

After one or more papers for a day are digested, run **`/daily-after-digest`** (or **`/daily-local-top`** alone). It scans sibling paper folders for that date and writes:

- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json`

Sections: Top 5 Mangaluru, Coastal Karnataka, Karnataka, India, International, Sports.

### Full Paper

Built by **`/daily-after-digest`** (or **`/daily-full-paper`**). Complete clustered news, Technology Top 5, and Opinion & Explainers. Not written for older days unless you name that date.

- `work/<DD-Mon-YYYY>/Full_paper/FullPaper_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Full_paper/FullPaper_<DD-Mon-YYYY>.json`

### Coastal Katte Top 5

After LocalTop5 exists, run **`/coastal-katte-top5`**. It picks **one focused Top 5** for `@coastal_katte` (infra+₹+dates, safety, accountability, local jobs; prefer Mangaluru/coastal):

- `work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json`

### Coastal Katte script

Run **`/coastal-katte-script`** after picking a story (Top 5 rank + date, headline, or pasted full article). Writes 3 hook variations + verified hybrid under:

- `work/<DD-Mon-YYYY>/Coastal_Katte/scripts/<slug>_script.md`

### Coastal Katte YouTube Top 5

Run **`/coastal-katte-youtube`** after Coastal Katte Top 5 exists. One 4–6 minute briefing covering **all five** stories in order (plus title, description, timestamps, thumbnail prompt):

- `work/<DD-Mon-YYYY>/Coastal_Katte/youtube/CoastalKatte_YT_Top5_<DD-Mon-YYYY>.md`

## Usage (new chat)

1. Open any Agent chat.
2. Attach a combined newspaper PDF (or give its path).
3. Run **`/digest-newspaper`** once **per paper**.
4. When every paper for the day is digested, run **`/daily-after-digest`**. That one command builds Local Top 5, Coastal Katte Top 5, Full Paper, and the YouTube briefing. It does **not** write the 1-minute reel script.
5. Run **`/coastal-katte-script`** only when you pick a story (e.g. `#1 from 30-Aug-2026` or a pasted full article).

Standalone commands still work if you only want one product: `/daily-local-top`, `/daily-full-paper`, `/coastal-katte-top5`, `/coastal-katte-youtube`.

If the slash command is missing, reload the Cursor window once.

## Parse in Python

```bash
python3 ~/.cursor/skills/newspaper-page-digest/scripts/parse_digest.py path/to/digest.md
```

Or `json.load` the matching `*_PageDigest.json`.

## Viewer (Local Top 5 + Full Paper + Coastal Katte)

A React + Tailwind UI under [`viewer/`](viewer/) reads the daily JSON live from `work/` in dev:

```bash
cd viewer && npm install && npm run dev
```

The **Full paper** tab appears only on days that have `Full_paper/FullPaper_*.json`. Older editions keep Daily Top 5 / Coastal Katte as they are.

**GitHub Pages:** pushing Top 5 / Full Paper JSON (or viewer changes) to `main` runs [`.github/workflows/deploy-viewer.yml`](.github/workflows/deploy-viewer.yml), which copies JSON into a static build and deploys to:

https://Rasheed-Nexhala.github.io/newspaper-page-digest/

Daily flow for a live site: finish **`/daily-after-digest`**, **commit + push** the new `work/<date>/Daily_top/`, `Full_paper/`, and `Coastal_Katte/*.json` — Actions redeploys automatically. See [`viewer/README.md`](viewer/README.md).

## Requirements

- Python 3 with `pypdf` (installed on first run via `pip install pypdf --break-system-packages`).
- For the viewer: Node.js + npm (`viewer/` dependencies).

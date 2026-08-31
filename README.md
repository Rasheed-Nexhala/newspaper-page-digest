# Newspaper Page Digest

Turns any combined, multi-page newspaper PDF into a Markdown digest (plus JSON) — page by page, with a heading and short 1–3 sentence blurb for **every article**. Also builds **daily local Top 5** and a **Coastal Katte channel Top 5**.

Installed as normal Cursor components under `.cursor/` (not as a marketplace plugin):

| Kind | Path |
|:-----|:-----|
| Skill | `.cursor/skills/newspaper-page-digest/` |
| Skill | `.cursor/skills/daily-local-top/` |
| Skill | `.cursor/skills/coastal-katte-top5/` |
| Skill | `.cursor/skills/coastal-katte-script/` |
| Skill | `.cursor/skills/coastal-katte-youtube/` |
| Command | `.cursor/commands/digest-newspaper.md` |
| Command | `.cursor/commands/daily-local-top.md` |
| Command | `.cursor/commands/coastal-katte-top5.md` |
| Command | `.cursor/commands/coastal-katte-script.md` |
| Command | `.cursor/commands/coastal-katte-youtube.md` |
| Agents | `.cursor/agents/page-extractor.md`, `.cursor/agents/news-editor.md` |

The same paths are linked into your user Cursor home so they work in **any** project:

- `~/.cursor/skills/newspaper-page-digest`
- `~/.cursor/skills/daily-local-top`
- `~/.cursor/skills/coastal-katte-top5`
- `~/.cursor/skills/coastal-katte-script`
- `~/.cursor/skills/coastal-katte-youtube`
- `~/.cursor/commands/digest-newspaper.md`
- `~/.cursor/commands/daily-local-top.md`
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

After one or more papers for a day are digested, run **`/daily-local-top`**. It scans sibling paper folders for that date and writes:

- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.md`
- `work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json`

Sections: Top 5 Mangaluru, Top 5 Coastal Karnataka, Top 5 Karnataka.

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
3. Run **`/digest-newspaper`**, or ask to “digest this page by page”.
4. When enough papers for the day are done, run **`/daily-local-top`**.
5. Run **`/coastal-katte-top5`** for the channel shortlist.
6. Run **`/coastal-katte-script`** with e.g. `#1 from 30-Aug-2026` or a pasted full article.
7. Run **`/coastal-katte-youtube`** for the all-five YouTube briefing.

If the slash command is missing, reload the Cursor window once.

## Parse in Python

```bash
python3 ~/.cursor/skills/newspaper-page-digest/scripts/parse_digest.py path/to/digest.md
```

Or `json.load` the matching `*_PageDigest.json`.

## Viewer (Local Top 5 + Coastal Katte)

A React + Tailwind UI under [`viewer/`](viewer/) reads the daily JSON live from `work/`:

```bash
cd viewer && npm install && npm run dev
```

Open the printed localhost URL. Use the date switcher for each day; new editions under `work/<DD-Mon-YYYY>/` show up after **Refresh dates** (or a page reload). See [`viewer/README.md`](viewer/README.md).

## Requirements

- Python 3 with `pypdf` (installed on first run via `pip install pypdf --break-system-packages`).
- For the viewer: Node.js + npm (`viewer/` dependencies).

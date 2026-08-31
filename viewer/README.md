# Top 5 Viewer

React + Tailwind UI for reading daily **Daily Top 5** (Mangaluru, Coastal Karnataka, Karnataka, India, International, Sports) and **Coastal Katte Top 5** JSON from `work/`.

## Local dev

The Vite dev server scans `../work/<DD-Mon-YYYY>/` on each request, so new days appear after you click **Refresh dates** (or reload) — no copy step.

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). With no `?date=` in the URL, the viewer opens **today’s** edition when available, otherwise the newest edition. Use the **dropdown** or **Older / Newer** to switch days; the selected day is kept in the URL as `?date=30-Aug-2026`.

### Saved articles

Tap **Save** on any Top 5 story (any day, Local or Coastal). Saves write to:

```
work/Saved/saved-articles.json
```

Newest saves stay on top. The **Saved** tab lists them. Commit and push that file so GitHub Pages picks it up. On the live site the list is **read-only** — add/remove only works in local `npm run dev`.

## Production / GitHub Pages

Static hosting has no live `work/` filesystem. Before build, `prepare-static-data.mjs` copies Top 5 JSON into `public/data/`:

```bash
npm run prepare-data   # only
npm run build          # prepare-data + tsc + vite build
npm run preview        # serve dist/ locally (needs VITE_BASE=/ if testing)
```

CI sets `VITE_BASE=/newspaper-page-digest/` and deploys `dist/` to GitHub Pages on every push to `main` that touches:

- `work/**/Daily_top/**`
- `work/**/Coastal_Katte/CoastalKatte_Top5_*.json`
- `work/Saved/**`
- `viewer/**`

Site: `https://Rasheed-Nexhala.github.io/newspaper-page-digest/`

## API (dev server only)

| Route | Returns |
|-------|---------|
| `GET /api/dates` | Discovered days (newest first) |
| `GET /api/local-top5/:dateSlug` | `LocalTop5_*.json` |
| `GET /api/coastal-katte/:dateSlug` | `CoastalKatte_Top5_*.json` |
| `GET /api/saved` | `work/Saved/saved-articles.json` (newest first) |
| `POST /api/saved` | Upsert one saved story (body = story JSON) |
| `DELETE /api/saved/:id` | Remove one saved story |

Expected source files:

```
work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_*.json
work/Saved/saved-articles.json
```

# Top 5 Viewer

React + Tailwind UI for reading daily **Daily Top 5**, **Full Paper** (when present), and **Coastal Katte Top 5** JSON from `work/`.

## Local dev

The Vite dev server scans `../work/<DD-Mon-YYYY>/` on each request, so new days appear after you click **Refresh dates** (or reload) — no copy step.

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). With no `?date=` in the URL, the viewer opens **today’s** edition when available, otherwise the newest edition. Use the **dropdown** or **Older / Newer** to switch days; the selected day is kept in the URL as `?date=30-Aug-2026`.

The **Full paper** tab is enabled only if that day has `Full_paper/FullPaper_*.json`. Days that only have Top 5 still work as before.

## Production / GitHub Pages

Static hosting has no live `work/` filesystem. Before build, `prepare-static-data.mjs` copies JSON into `public/data/`:

```bash
npm run prepare-data   # only
npm run build          # prepare-data + tsc + vite build
npm run preview        # serve dist/ locally (needs VITE_BASE=/ if testing)
```

CI sets `VITE_BASE=/newspaper-page-digest/` and deploys `dist/` to GitHub Pages on every push to `main` that touches:

- `work/**/Daily_top/**`
- `work/**/Coastal_Katte/CoastalKatte_Top5_*.json`
- `work/**/Full_paper/**`
- `viewer/**`

Site: `https://Rasheed-Nexhala.github.io/newspaper-page-digest/`

## API (dev server only)

| Route | Returns |
|-------|---------|
| `GET /api/dates` | Discovered days (newest first) |
| `GET /api/local-top5/:dateSlug` | `LocalTop5_*.json` |
| `GET /api/coastal-katte/:dateSlug` | `CoastalKatte_Top5_*.json` |
| `GET /api/full-paper/:dateSlug` | `FullPaper_*.json` |

Expected source files:

```
work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Full_paper/FullPaper_<DD-Mon-YYYY>.json
```

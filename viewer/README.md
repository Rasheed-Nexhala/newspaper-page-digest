# Top 5 Viewer

React + Tailwind UI for reading daily **Local Top 5** and **Coastal Katte Top 5** JSON from `work/`.

The Vite dev server scans `../work/<DD-Mon-YYYY>/` on each request, so new days appear after you click **Refresh dates** (or reload) — no copy step.

## Run

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## API (dev server)

| Route | Returns |
|-------|---------|
| `GET /api/dates` | Discovered days (newest first) |
| `GET /api/local-top5/:dateSlug` | `LocalTop5_*.json` |
| `GET /api/coastal-katte/:dateSlug` | `CoastalKatte_Top5_*.json` |

Expected files:

```
work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json
```

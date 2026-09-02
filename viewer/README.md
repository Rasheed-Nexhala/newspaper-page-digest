# Top 5 Viewer

React + Tailwind UI for reading daily **Daily Top 5**, **Full Paper** (when present), and **Coastal Katte Top 5** JSON from `work/`, plus a signed-in **Saved** tab and a **Search** tab over Full Paper articles in Firestore.

## Local dev

The Vite dev server scans `../work/<DD-Mon-YYYY>/` on each request, so new days appear after you click **Refresh dates** (or reload) — no copy step.

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). With no `?date=` in the URL, the viewer opens **today’s** edition when available, otherwise the newest edition. Use the **dropdown** or **Older / Newer** to switch days; the selected day is kept in the URL as `?date=30-Aug-2026`.

The **Full paper** tab is enabled only if that day has `Full_paper/FullPaper_*.json` (the tab loads the clustered stories from Firestore). Days that only have Top 5 still work as before. **Search** looks across every Full Paper day that has been synced.

## Production / Firebase Hosting

Static hosting has no live `work/` filesystem. Before build, `prepare-static-data.mjs` copies Daily Top 5 and Coastal Katte JSON into `public/data/` (Full Paper is served from Firestore, not copied):

```bash
npm run prepare-data   # only
npm run build          # prepare-data + tsc + vite build
npm run preview        # serve dist/ locally
```

CI deploys `dist/` to Firebase Hosting on every push to `main` that touches:

- `work/**/Daily_top/**`
- `work/**/Coastal_Katte/CoastalKatte_Top5_*.json`
- `work/**/Full_paper/**`
- `viewer/**`
- `firebase.json` / `.firebaserc`

Sites:

- https://newspaper-page-digest.web.app
- https://newspaper-page-digest.firebaseapp.com

## Saved articles (Firestore)

The viewer stays public for reading. Users sign in with Google only when they save stories or open the Saved tab.

### Local setup

1. Copy `viewer/.env.example` to `viewer/.env.local`
2. Fill `VITE_FIREBASE_*` values from Firebase web app config
3. In Firebase Auth authorized domains, include:
   - `localhost`
   - `newspaper-page-digest.web.app`
   - `newspaper-page-digest.firebaseapp.com`

### Firestore data model

- `users/{uid}/saved_articles/{articleId}` — owner-only bookmarks
- `editions/{date_slug}` — Full Paper metadata (labels, summary, papers scanned)
- `articles/{articleId}` — one clustered Full Paper story per document (public read)
- `articleId` is stable per day/source set so the same article dedupes across Full Paper, Search, and Saved

### Publish Full Paper to Firestore

After writing `work/<date>/Full_paper/FullPaper_*.json`:

```bash
cd viewer
npm run sync-firestore
```

Uses Application Default Credentials, or set `FIREBASE_SERVICE_ACCOUNT` to the service-account JSON. CI runs this on every deploy. Optional: `npm run sync-firestore 02-Sep-2026` to sync one day.

### CI secrets

Add these GitHub Actions secrets:

- `FIREBASE_SERVICE_ACCOUNT`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## API (dev server only)

| Route | Returns |
|-------|---------|
| `GET /api/dates` | Discovered days (newest first) |
| `GET /api/local-top5/:dateSlug` | `LocalTop5_*.json` |
| `GET /api/coastal-katte/:dateSlug` | `CoastalKatte_Top5_*.json` |

Full Paper is not served from `/api` in the UI; the viewer reads `editions` + `articles` from Firestore. The dev middleware still has `GET /api/full-paper/:dateSlug` for debugging.

Expected source files:

```
work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Full_paper/FullPaper_<DD-Mon-YYYY>.json
```

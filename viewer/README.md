# Top 5 Viewer

React + Tailwind UI for reading daily **Daily Top 5**, **Full Paper** (when present), and **Coastal Katte Top 5** JSON from `work/`, plus a signed-in **Saved** tab backed by Firestore.

## Local dev

The Vite dev server scans `../work/<DD-Mon-YYYY>/` on each request, so new days appear after you click **Refresh dates** (or reload) — no copy step.

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). With no `?date=` in the URL, the viewer opens **today’s** edition when available, otherwise the newest edition. Use the **dropdown** or **Older / Newer** to switch days; the selected day is kept in the URL as `?date=30-Aug-2026`.

The **Full paper** tab is enabled only if that day has `Full_paper/FullPaper_*.json`. Days that only have Top 5 still work as before.

## Production / Firebase Hosting

Static hosting has no live `work/` filesystem. Before build, `prepare-static-data.mjs` copies JSON into `public/data/`:

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

- Collection: `users/{uid}/saved_articles/{articleId}`
- `articleId` is stable per day/source set so the same article dedupes across tabs
- Rules only allow owner access (`request.auth.uid == uid`)

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
| `GET /api/full-paper/:dateSlug` | `FullPaper_*.json` |

Expected source files:

```
work/<DD-Mon-YYYY>/Daily_top/LocalTop5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Coastal_Katte/CoastalKatte_Top5_<DD-Mon-YYYY>.json
work/<DD-Mon-YYYY>/Full_paper/FullPaper_<DD-Mon-YYYY>.json
```

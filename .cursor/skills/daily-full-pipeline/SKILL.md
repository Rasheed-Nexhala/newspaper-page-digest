---
name: daily-full-pipeline
description: >-
  Runs the complete one-shot daily newspaper flow: digest every attached or
  named PDF in parallel (one subagent per paper), then the daily pack (Local Top
  5, Coastal Katte Top 5, Firestore sync), then commit and deploy. Full Paper,
  YouTube briefing, and reel scripts are disabled. Use when the user wants
  digests through publish in one go, names this skill, or runs
  /daily-full-pipeline with multiple newspaper PDFs.
---

# Daily full pipeline

End-to-end day: **digest all papers → daily pack → commit + deploy**.

Do **not** invent parallel digest/pack logic. Load and follow each child skill **exactly**:

| Phase | Skill / command | Path |
|-------|-----------------|------|
| 1 | `newspaper-page-digest` | `.cursor/skills/newspaper-page-digest/SKILL.md` |
| 2 | `daily-after-digest` | `.cursor/skills/daily-after-digest/SKILL.md` |
| 3 | Commit + deploy (this skill) | below |

Child skills own their hard lessons, output specs, and layouts — reference them; do not duplicate.

This pipeline **does not** write Full Paper, YouTube briefing, or Coastal Katte reel scripts — those products are disabled.

## Hard lessons

1. **One background Task subagent per newspaper PDF** — never serialize all papers in the parent, never one mega-agent for every PDF.
2. **Gate the daily pack** — do not start Phase 2 until every paper’s `*_PageDigest.md` + `*_PageDigest.json` exist and are validated.
3. **One shared date** — resolve `DD-Mon-YYYY` from mastheads; all papers for this run must land under the same `work/<date>/`.
4. **Do not backfill** older `work/<date>/` folders unless the user named that past date.
5. **Do not run** Full Paper, YouTube, or reel script skills — they are disabled.
6. **Chat replies stay short** — summaries + paths only; never paste full digests or Top 5 lists.

## Phase 1 — Digest all PDFs (parallel)

1. Collect every newspaper PDF the user attached or named (paths in the slash command / message).
2. For **each** PDF, launch **one** Task subagent (`generalPurpose` or equivalent) in the **background**, in parallel. Each agent’s prompt must say:
   - Follow `.cursor/skills/newspaper-page-digest/SKILL.md` **exactly** (and `references/output-spec.md`).
   - Digest **only** this absolute PDF path.
   - Write under `work/<DD-Mon-YYYY>/<Paper_Slug>/` after reading the masthead date.
   - Return a short summary + both PageDigest paths — not the full digest.
3. Parent waits until **all** subagents succeed. If any fails, fix/resume that paper before Phase 2; do not partial-pack.
4. Confirm every expected paper has both `*_PageDigest.md` and `*_PageDigest.json` under the same date folder.
5. Shared date = the masthead date those digests used. If papers disagree on date, stop and ask (do not invent a merge).

## Phase 2 — Daily pack

Follow **`daily-after-digest` exactly** (`.cursor/skills/daily-after-digest/SKILL.md`):

1. `daily-local-top`
2. `coastal-katte-top5`
<!-- Disabled:
3. `daily-full-paper`
4. `coastal-katte-youtube`
-->
3. Firestore sync: `cd viewer && npm run sync-firestore` (optional date arg if supported)

Do not rewrite PageDigests. Do not start this phase until Phase 1 is complete for every PDF in the run.

## Phase 3 — Commit + deploy

This command **includes publish by design** — always run Phase 3 at the end (unless a hard failure stopped earlier phases).

### Commit

1. Stage mainly that day’s publishable outputs under `work/<date>/`:
   - Paper `*_PageDigest.*`
   - `Daily_top/`, `Coastal_Katte/`
   <!-- Disabled: `Full_paper/`, `Coastal_Katte/youtube/`, reel `scripts/` -->
2. Include related dirty code only if it is clearly part of the same publish (e.g. viewer/sync already touched for this day). Do **not** force-commit unrelated dirty files.
3. **Exclude:** `work/_temp/`, `.firebase/` cache, secrets (`.env`, credentials, service-account JSON), and leftover intermediates (`pages/`, `transcripts/`, `edited/`).
4. Git safety:
   - Never update git config
   - Never force push
   - Never skip hooks (`--no-verify`, etc.)
   - Commit message via HEREDOC
   - Do not commit secrets

Example message shape:

```bash
git commit -m "$(cat <<'EOF'
Publish <DD-Mon-YYYY> digests and daily pack.

EOF
)"
```

### Deploy

Prefer the repo’s normal path: **push to `origin`** (usually `main`) so `.github/workflows/deploy-viewer.yml` builds the viewer, syncs Firestore, and deploys Hosting/Firestore.

If push is blocked or the user asked for a local deploy instead:

```bash
cd viewer && npm run sync-firestore
cd viewer && npm run build
npx -y firebase-tools@latest deploy --only hosting,firestore --project newspaper-page-digest --non-interactive
```

Only when credentials/CLI allow. If credentials are missing, finish the commit, report paths, and tell the user to push or run deploy with Firebase auth.

## Deliver

One short block:

- Date and papers digested
- Paths: each PageDigest pair, Local Top 5, Coastal Katte Top 5
- Commit hash / branch and push or deploy result

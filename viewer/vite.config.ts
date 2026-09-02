import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workApiPlugin } from './vite.work-api.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const workRoot = path.resolve(rootDir, '../work')

// Firebase Hosting serves at the domain root.
const base = process.env.VITE_BASE || '/'
// Bust CDN cache for work/data JSON (same path across deploys).
const dataCacheBust =
  process.env.GITHUB_SHA?.slice(0, 12) ?? String(Date.now())

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __DATA_CACHE_BUST__: JSON.stringify(dataCacheBust),
  },
  plugins: [react(), tailwindcss(), workApiPlugin(workRoot)],
  server: {
    fs: {
      allow: [rootDir, workRoot],
    },
  },
})

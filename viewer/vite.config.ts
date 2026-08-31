import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workApiPlugin } from './vite.work-api.ts'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const workRoot = path.resolve(rootDir, '../work')

// GitHub Pages project site: set VITE_BASE=/newspaper-page-digest/ in CI.
// Local `npm run dev` keeps base at `/`.
const base = process.env.VITE_BASE || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), workApiPlugin(workRoot)],
  server: {
    fs: {
      allow: [rootDir, workRoot],
    },
  },
})

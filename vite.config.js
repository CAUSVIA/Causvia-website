import { defineConfig } from 'vite'

// Single-page static site: /index.html plus the static files in /public.
export default defineConfig({
  server: { port: Number(process.env.PORT) || 5173 },
})

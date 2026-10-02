import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// Multi-page static site: the landing page, /auth (sign-in and early access) and /app, plus the files in /public.
const page = (f) => fileURLToPath(new URL(f, import.meta.url))
const CLEAN = { '/auth': '/auth.html', '/app': '/app.html' }

// serve /auth and /app without the .html suffix locally, matching the rewrites in vercel.json
function cleanUrls() {
  const rewrite = (req, _res, next) => {
    const [path, query] = req.url.split('?')
    const to = CLEAN[path.replace(/\/+$/, '')]
    if (to) req.url = to + (query ? '?' + query : '')
    next()
  }
  return {
    name: 'clean-urls',
    configureServer: (server) => { server.middlewares.use(rewrite) },
    configurePreviewServer: (server) => { server.middlewares.use(rewrite) },
  }
}

export default defineConfig({
  plugins: [cleanUrls()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      input: { main: page('index.html'), auth: page('auth.html'), app: page('app.html') },
    },
  },
})

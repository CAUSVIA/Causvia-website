import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Multi-page static site: the landing page, /about, /auth (sign-in and early access), /app, /charter and the legal pages,
// plus the files in /public.
const page = (f) => fileURLToPath(new URL(f, import.meta.url))
const CLEAN = { '/about': '/about.html', '/auth': '/auth.html', '/app': '/app.html', '/charter': '/charter.html' }

// serve /about, /auth, /app and /charter without the .html suffix locally, matching the rewrites in vercel.json
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

// One shared footer: every page carries <!-- horizon-footer cta="on|off" --> and gets src/footer/footer.html
// (plus its script) in its place. cta="off" drops the "Your turn to take the controls" card.
const FOOTER = page('src/footer/footer.html')
const FOOTER_MARK = /<!--\s*horizon-footer(?:\s+cta="(on|off)")?\s*-->/
function horizonFooter() {
  return {
    name: 'horizon-footer',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const m = html.match(FOOTER_MARK)
        if (!m) return html
        const cta = m[1] || 'on'
        let part = readFileSync(FOOTER, 'utf8').replace('data-footer-cta="on"', `data-footer-cta="${cta}"`)
        part = cta === 'off' ? part.replace(/\s*<!--hz-cta-->[\s\S]*?<!--\/hz-cta-->/, '') : part.replace(/<!--\/?hz-cta-->\n?/g, '')
        return html.replace(FOOTER_MARK, () => part.trim() + '\n<script type="module" src="/src/footer/footer.js"></script>')
      },
    },
    configureServer(server) {
      server.watcher.add(FOOTER)
      server.watcher.on('change', (f) => { if (resolve(f) === FOOTER) server.ws.send({ type: 'full-reload' }) })
    },
  }
}

export default defineConfig({
  plugins: [cleanUrls(), horizonFooter()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      input: {
        main: page('index.html'), about: page('about.html'), auth: page('auth.html'), app: page('app.html'),
        privacy: page('privacy.html'), terms: page('terms.html'), charter: page('charter.html'),
      },
    },
  },
})

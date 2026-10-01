import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      input: {
        // official site: the cockpit flythrough
        main: resolve(__dirname, 'index.html'),
        // previous tactical redesign, kept reachable at /tactical.html
        tactical: resolve(__dirname, 'tactical.html'),
      },
    },
  },
})

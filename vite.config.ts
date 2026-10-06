import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves this repository at the domain root (an <org>.github.io site), so base is "/".
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      // Pages has no server-side rewrite for a client-routed app: a deep link (/docs/concepts/plugins) would 404 on a hard
      // reload. Serving index.html as 404.html lets the router resolve the real path in the browser.
      name: 'copy-index-to-404',
      closeBundle() {
        copyFileSync(resolve(__dirname, 'dist/index.html'), resolve(__dirname, 'dist/404.html'))
      },
    },
  ],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})

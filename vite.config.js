import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// Injects <meta name="app-version"> and no-cache headers into all HTML entry points
function injectVersionMeta() {
  return {
    name: 'inject-version-meta',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        [
          '<meta charset="UTF-8" />',
          `    <meta name="app-version" content="${pkg.version}" />`,
          '    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
          '    <meta http-equiv="Pragma" content="no-cache" />',
          '    <meta http-equiv="Expires" content="0" />',
        ].join('\n'),
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), injectVersionMeta()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projection: resolve(__dirname, 'projection.html'),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(
      new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    ),
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rawBase = process.env.BASE_PATH || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
const apiPrefix = `${base}api`
const uploadsPrefix = `${base}uploads`

export default defineConfig({
  base,
  plugins: [react()],
  esbuild: {
    charset: 'utf8'
  },
  build: {
    charset: 'utf8'
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      [apiPrefix]: {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), '/api')
      },
      [uploadsPrefix]: {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${uploadsPrefix}`), '/uploads')
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js']
  }
})

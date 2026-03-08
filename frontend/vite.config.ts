import { URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

const isLocalHttpUrl = (value: string) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i.test(value)

const resolveToriiTarget = () => {
  const configured = process.env.VITE_DOJO_TORII_URL || 'http://127.0.0.1:8080'

  if (!isLocalHttpUrl(configured)) {
    return configured.replace(/\/$/, '')
  }

  const url = new URL(configured)
  return url.toString().replace(/\/$/, '')
}

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true'
  const toriiTarget = resolveToriiTarget()
  const plugins = [wasm(), topLevelAwait(), react()]

  return {
    plugins: isTest ? plugins : [...plugins, mkcert()],
    server: {
      cors: true,
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/rpc': {
          target: 'http://127.0.0.1:5050',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/rpc/, ''),
        },
        '/torii': {
          target: toriiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/torii/, ''),
        },
      },
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})

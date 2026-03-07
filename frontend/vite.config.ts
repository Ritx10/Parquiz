import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true'

  return {
    plugins: isTest ? [wasm(), topLevelAwait(), react()] : [wasm(), topLevelAwait(), react(), mkcert()],
    server: {
      host: '0.0.0.0',
      port: 5173,
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

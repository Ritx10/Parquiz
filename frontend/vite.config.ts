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

  const manualChunks = (id: string) => {
    if (!id.includes('node_modules')) {
      return undefined
    }

    if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
      return 'vendor-react'
    }

    if (id.includes('/@starknet-react/') || id.includes('/starknet/')) {
      return 'vendor-starknet'
    }

    if (id.includes('/@dojoengine/')) {
      return 'vendor-dojo'
    }

    if (id.includes('/@cartridge/')) {
      return 'vendor-cartridge'
    }

    if (
      id.includes('/@reown/') ||
      id.includes('/@walletconnect/') ||
      id.includes('/viem/') ||
      id.includes('/ethers/') ||
      id.includes('/@coinbase/') ||
      id.includes('/@base-org/') ||
      id.includes('/@turnkey/') ||
      id.includes('/@solana/')
    ) {
      return 'vendor-wallets'
    }

    if (id.includes('/@bufbuild/') || id.includes('/@protobuf-ts/')) {
      return 'vendor-grpc'
    }

    if (id.includes('/effect/') || id.includes('/@effect/')) {
      return 'vendor-effect'
    }

    if (id.includes('/ox/')) {
      return 'vendor-ox'
    }

    if (id.includes('/@noble/') || id.includes('/@scure/')) {
      return 'vendor-crypto'
    }

    return 'vendor-misc'
  }

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
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

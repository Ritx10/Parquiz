import http2 from 'node:http2'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import topLevelAwait from 'vite-plugin-top-level-await'
import wasm from 'vite-plugin-wasm'

const isLocalHttpUrl = (value: string) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i.test(value)

const resolveToriiGrpcTarget = () => {
  const configured = process.env.VITE_DOJO_TORII_URL || 'http://127.0.0.1:50051'

  if (!isLocalHttpUrl(configured)) {
    return configured
  }

  const url = new URL(configured)

  if (url.port === '8080') {
    url.port = '50051'
  }

  return url.toString().replace(/\/$/, '')
}

const createToriiGrpcMiddleware = (target: string) => {
  const targetUrl = new URL(target)
  const targetOrigin = `${targetUrl.protocol}//${targetUrl.host}`

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/torii/')) {
      next()
      return
    }

    const upstream = http2.connect(targetOrigin)
    const requestHeaders: Record<string, string> = {
      ':method': req.method || 'POST',
      ':path': req.url.replace(/^\/torii/, '') || '/',
    }

    for (const [header, rawValue] of Object.entries(req.headers)) {
      if (
        rawValue === undefined ||
        header.startsWith(':') ||
        header === 'host' ||
        header === 'connection' ||
        header === 'transfer-encoding'
      ) {
        continue
      }

      requestHeaders[header] = Array.isArray(rawValue) ? rawValue.join(', ') : rawValue
    }

    const upstreamRequest = upstream.request(requestHeaders)

    const closeUpstream = () => {
      try {
        upstreamRequest.close()
      } catch {
        // noop
      }

      try {
        upstream.close()
      } catch {
        // noop
      }
    }

    upstreamRequest.on('response', (headers) => {
      const status = Number(headers[':status'] || 200)
      res.statusCode = status

      for (const [header, rawValue] of Object.entries(headers)) {
        if (header.startsWith(':') || rawValue === undefined) {
          continue
        }

        res.setHeader(header, rawValue as string | string[])
      }

      res.flushHeaders?.()
    })

    upstreamRequest.on('trailers', (headers) => {
      const trailers = Object.entries(headers).filter(([, value]) => value !== undefined)

      if (trailers.length === 0) {
        return
      }

      try {
        res.addTrailers(Object.fromEntries(trailers) as Record<string, string>)
      } catch {
        // noop
      }
    })

    upstreamRequest.on('data', (chunk) => {
      res.write(chunk)
    })

    upstreamRequest.on('end', () => {
      res.end()
      closeUpstream()
    })

    upstreamRequest.on('error', (error) => {
      if (!res.headersSent) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'text/plain')
      }

      res.end(`Torii gRPC proxy error: ${error.message}`)
      closeUpstream()
    })

    req.on('data', (chunk: Buffer) => {
      upstreamRequest.write(chunk)
    })

    req.on('end', () => {
      upstreamRequest.end()
    })

    req.on('aborted', closeUpstream)
    res.on('close', closeUpstream)
  }
}

const toriiGrpcProxyPlugin = (target: string): Plugin => ({
  name: 'torii-grpc-proxy',
  configureServer(server) {
    server.middlewares.use(createToriiGrpcMiddleware(target))
  },
})

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true'
  const toriiGrpcTarget = resolveToriiGrpcTarget()
  const plugins = [wasm(), topLevelAwait(), react(), toriiGrpcProxyPlugin(toriiGrpcTarget)]

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

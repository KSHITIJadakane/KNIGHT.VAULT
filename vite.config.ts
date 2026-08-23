import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    {
      // Ensure ZK binary assets are served with correct headers
      name: 'zk-asset-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          if (url.includes('/zk/') || url.includes('/contract/')) {
            if (url.endsWith('.prover') || url.endsWith('.verifier') ||
                url.endsWith('.zkir') || url.endsWith('.bzkir')) {
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Access-Control-Allow-Origin', '*');
            }
          }
          next();
        });
      },
    },
    {
      // Shared server-side sandbox state store so PC and Mobile sync in real-time
      name: 'sandbox-state-sync',
      configureServer(server) {
        const vaultStateDb = new Map<string, any>();
        server.middlewares.use('/api/sandbox-state', (req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.setEncoding('utf8');
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                if (data.address && data.state) {
                  vaultStateDb.set(data.address, data.state);
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON', raw: body }));
              }
            });
            return;
          }

          if (req.method === 'GET') {
            const url = new URL(req.url ?? '', `http://${req.headers.host || 'localhost'}`);
            const address = url.pathname.replace(/^\//, '');
            res.setHeader('Content-Type', 'application/json');
            if (address && vaultStateDb.has(address)) {
              res.end(JSON.stringify(vaultStateDb.get(address)));
            } else {
              res.end(JSON.stringify(null));
            }
            return;
          }

          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      'isomorphic-ws': path.resolve(__dirname, 'src/lib/isomorphic-ws-fix.mjs'),
      'object-inspect': path.resolve(__dirname, 'src/lib/object-inspect-fix.mjs'),
    },
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/ledger-v8', '@midnight-ntwrk/compact-runtime'],
  },
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0, // Never inline ZK WASM or binary assets
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/proof-server': {
        target: 'http://127.0.0.1:6300',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proof-server/, ''),
      },
    },
  },
});

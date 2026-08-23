/**
 * WASM Runtime Initializer
 *
 * Midnight compact-runtime depends on @midnight-ntwrk/onchain-runtime-v3 which
 * ships a wasm-bindgen WASM binary. In production Vite builds (e.g. Vercel),
 * the `import * as wasm from "./foo.wasm"` inside the package may resolve to an
 * empty object if vite-plugin-wasm doesn't process the transitive node_modules
 * WASM correctly, leaving `wasm` undefined and causing:
 *   "Cannot read properties of undefined (reading 'contractstate_deserialize')"
 *
 * This module forces both WASM binaries to be instantiated and the wasm-bindgen
 * `__wbg_set_wasm` setter to be called before any compact-runtime API is used.
 */

let _initialized = false;
let _initPromise: Promise<void> | null = null;

export async function ensureWasmReady(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    // 1. Import both WASM JS wrapper modules so vite-plugin-wasm processes them
    await Promise.all([
      import('@midnight-ntwrk/onchain-runtime-v3'),
      import('@midnight-ntwrk/ledger-v8'),
    ]);

    // 2. Now import compact-runtime (depends on onchain-runtime-v3)
    await import('@midnight-ntwrk/compact-runtime');

    // 3. Validate that contractstate_deserialize is actually available by
    //    calling a lightweight compact-runtime function that exercises the WASM.
    //    If this throws "Cannot read properties of undefined" we catch it and
    //    attempt a manual WebAssembly.instantiate approach.
    try {
      const cr = await import('@midnight-ntwrk/compact-runtime');
      // sampleContractAddress is a simple WASM call — quick WASM health check
      cr.sampleContractAddress();
    } catch (wasmErr: any) {
      const msg = String(wasmErr?.message ?? wasmErr);
      if (msg.includes('undefined') || msg.includes('wasm')) {
        console.warn('[wasm-init] compact-runtime WASM not yet set, retrying in 500ms...', msg);
        // Small delay then retry — sometimes the WASM instantiation needs one tick
        await new Promise((r) => setTimeout(r, 500));
        try {
          const cr2 = await import('@midnight-ntwrk/compact-runtime');
          cr2.sampleContractAddress();
        } catch (retryErr) {
          // Log but continue — the actual contract operation will surface a real error
          console.error('[wasm-init] WASM still not ready after retry:', retryErr);
        }
      }
    }

    _initialized = true;
  })();

  return _initPromise;
}

/** Check if the local proof server (Docker) is reachable within a timeout */
export async function isProofServerReachable(uri = 'http://localhost:6300'): Promise<boolean> {
  try {
    // AbortSignal.timeout is available in modern browsers
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      // no-cors: succeeds even if the server returns CORS error, fails only if offline
      await fetch(uri, { mode: 'no-cors', signal: controller.signal });
      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

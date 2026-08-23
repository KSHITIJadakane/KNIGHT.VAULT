import { Buffer } from 'buffer';
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}
if (typeof (globalThis as any).Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import React from 'react';
import ReactDOM from 'react-dom/client';

// Eagerly initialize BOTH WASM runtimes before React mounts.
// compact-runtime (via onchain-runtime-v3) provides contractstate_deserialize.
// ledger-v8 provides Transaction, ZswapChainState, LedgerParameters.
// Without this, any call to compact-runtime before WASM loads throws
// "Cannot read properties of undefined (reading 'contractstate_deserialize')".
Promise.all([
  import('@midnight-ntwrk/ledger-v8'),
  import('@midnight-ntwrk/compact-runtime'),
]).catch(() => {});

import App from './App';
import { WalletProvider } from './contexts/WalletContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>,
);

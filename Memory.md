# Project Memory & Active State Context

This file serves as durable operational memory across chat sessions and AI developer transitions.

---

## 1. Current Project State

* **Application Status**: Active & Live
* **Dev Server URL**: `http://localhost:5173/`
* **Local Proof Server**: Running via Docker on `http://localhost:6300` (`midnightntwrk/proof-server:latest`)
* **WSL Toolchain**: Ubuntu (WSL 2) running `compact` v0.5.2 / compiler v0.31.1 at `/home/kshitij/.local/bin/compact`
* **Supported Wallets**: 1AM (`window.midnight['1am']`) and Lace (`window.midnight.mnLace`)
* **Network Target**: Midnight Preprod Testnet (with zero-gas dust sponsorship enabled)

---

## 2. Key Architecture Decisions & Established Patterns

1. **Low-Level Transaction Execution**:
   * Always use `createUnprovenDeployTx` + `submitTxAsync` for deployment.
   * Always use `createUnprovenCallTx` + `submitTxAsync` for circuit calls.
   * Never use `deployContract()` (which hangs on preprod indexer lag).

2. **GraphQL Offset Bug Workaround**:
   * Preprod/Preview indexers throw GraphQL syntax errors on `offset: null`.
   * Standardized custom query `createPatchedPublicDataProvider` is active in `src/lib/midnight.ts`.

3. **Browser Bundler Configuration**:
   * `vite.config.ts` includes `resolve.alias` mapping `isomorphic-ws` to `src/lib/isomorphic-ws-fix.mjs`.
   * `build.target` is set to `'esnext'` with `vite-plugin-wasm`.
   * ZK keys and `.zkir` files are copied to `public/zk/payment/` via `scripts/sync-assets.mjs`.

4. **UI Design Standard**:
   * Built according to `impeccable` design rules (Institutional Cryptographic Workstation).
   * Verified with `npx -y impeccable detect src/` (0 anti-patterns).

---

## 3. Quick Command Cheatsheet

| Task | Command |
| :--- | :--- |
| **Start Frontend Dev Server** | `npm run dev` |
| **Recompile Smart Contract** | `npm run compact` |
| **Sync ZK Proving Assets** | `npm run sync:assets` |
| **Production Build Check** | `npm run build` |
| **Audit Design Anti-Patterns**| `npx -y impeccable detect src/` |
| **Check WSL & Compact** | `wsl -d Ubuntu bash -l -c "compact --version"` |
| **Check Docker Proof Server** | `docker ps` |

---

## 4. Key File Locations

* **Smart Contract Source**: [`contract/src/payment.compact`](file:///d:/codeverse/workshop%20stuffs/contract/src/payment.compact)
* **Compiled TypeScript Bindings**: [`contract/src/managed/payment/contract/index.js`](file:///d:/codeverse/workshop%20stuffs/contract/src/managed/payment/contract/index.js)
* **Midnight Session & Providers**: [`src/lib/midnight.ts`](file:///d:/codeverse/workshop%20stuffs/src/lib/midnight.ts)
* **Payment Vault SDK Operations**: [`src/lib/payment.ts`](file:///d:/codeverse/workshop%20stuffs/src/lib/payment.ts)
* **Main Application UI**: [`src/App.tsx`](file:///d:/codeverse/workshop%20stuffs/src/App.tsx)
* **Design Specification**: [`Design.md`](file:///d:/codeverse/workshop%20stuffs/Design.md)

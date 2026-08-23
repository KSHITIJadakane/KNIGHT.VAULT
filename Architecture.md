# System Architecture Document

## 1. System Topology & Data Flow

```
                      ┌───────────────────────────────────────────────┐
                      │              Browser Client (SPA)             │
                      │  - React 18 + Vite + TypeScript               │
                      │  - Midnight.js SDK & Compact Runtime          │
                      │  - In-Memory Private State Store              │
                      └───────────────┬───────────────────────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       ▼                             ▼
       ┌───────────────────────────────┐   ┌───────────────────────────────┐
       │      Local / Cloud Prover     │   │        Lace Wallet API        │
       │    (midnightntwrk/proof-      │   │  (window.midnight.mnLace)     │
       │     server on port 6300)      │   │  - Dust Fee Sponsorship       │
       │  - ZK-SNARK Proving Engine    │   │  - Transaction Serialization  │
       └───────────────┬───────────────┘   └───────────────┬───────────────┘
                       │                                   │
                       └──────────────┬────────────────────┘
                                      ▼
                      ┌────────────────────────────────┐
                      │    Midnight Network Node       │
                      │  - Preprod / Preview Testnet   │
                      │  - Substrate-based RPC / Chain │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │     Midnight Indexer v4        │
                      │  - GraphQL State Queries       │
                      │  - Custom Patched Fetcher      │
                      └────────────────────────────────┘
```

---

## 2. Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Smart Contract** | Compact Language (`v0.20+`) | Zero-Knowledge circuits & ledger state logic |
| **Compiler Toolchain** | WSL 2 (Ubuntu) / `compact` CLI | Native Linux binary compiler generating ZKIR and TS interfaces |
| **ZK Proving** | Docker (`midnightntwrk/proof-server:latest`) | Local proving daemon running on `http://localhost:6300` |
| **Frontend Framework** | React 18 + Vite 6 + TypeScript 5 | High-speed Single Page Application with ESNext / WASM support |
| **Styling & Design** | Tailwind CSS 3.4 (Impeccable Design System) | Institutional matte surfaces, crisp borders, tabular numerals |
| **Blockchain SDK** | Midnight.js (`@midnight-ntwrk/*`) | Contract compilation handles, provider orchestration, and ledger types |
| **Wallet Connector** | DApp Connector API (`Midnight Lace Wallet`) | Sponsored dust fees, balanceUnsealedTransaction, key derivation |

---

## 3. Directory & File Structure

```
d:\codeverse\workshop stuffs\
├── .agents/                      # AI Agent customizations, skills (compact, midnight-js, impeccable)
├── contract/                     # Smart contract workspace
│   ├── src/
│   │   ├── payment.compact       # Core Compact smart contract source code
│   │   └── managed/payment/      # Compiler output: TS bindings, keys (.prover/.verifier), zkir
│   └── package.json
├── public/                       # Static public assets
│   ├── contract/payment/         # Synced contract assets
│   └── zk/payment/               # Static ZK proving keys and ZKIR files for FetchZkConfigProvider
├── scripts/
│   └── sync-assets.mjs           # Asset synchronization pipeline (contract -> public)
├── src/                          # Frontend source code
│   ├── components/               # React modular UI components
│   │   ├── ContractDeployer.tsx  # Vault deployment & existing contract attachment
│   │   ├── DepositCard.tsx       # Deposit inflow form & presets
│   │   ├── Navbar.tsx            # Network, wallet, and proof engine status bar
│   │   ├── TransactionStatusModal.tsx # Execution pipeline inspector
│   │   ├── VaultMetrics.tsx      # On-chain liquidity & flow analytics
│   │   └── WithdrawCard.tsx      # Owner-authorized withdrawal form
│   ├── contexts/
│   │   └── WalletContext.tsx     # Lace wallet state context
│   ├── lib/
│   │   ├── isomorphic-ws-fix.mjs # Browser WebSocket shim for indexer
│   │   ├── midnight.ts           # Provider factory, patched indexer, session setup
│   │   └── payment.ts            # Low-level deploy, circuit calls, indexer polling
│   ├── App.tsx                   # Main workstation layout & activity logger
│   ├── index.css                 # Institutional design tokens & resets
│   └── main.tsx                  # React DOM mount point
├── Architecture.md               # App flow & architecture documentation
├── Design.md                     # Design system & visual palette specs
├── Memory.md                     # Active project state & task memory
├── package.json                  # NPM dependencies & lifecycle scripts
├── Phases.md                     # Implementation phase breakdown
├── PRD.md                        # Product Requirements Document
├── Rules.md                      # AI agent constraints & development boundaries
├── tailwind.config.js            # Tailwind theme extensions
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite bundler config with WASM & top-level-await
```

---

## 4. Key Architectural Patterns

1. **Low-Level Transaction Dispatch**: Uses `createUnprovenDeployTx` / `createUnprovenCallTx` + `submitTxAsync` to avoid hanging promises caused by legacy `watchForTxData` on testnets.
2. **GraphQL Offset Patching**: Replaces standard `queryContractState` with a custom unpaginated GraphQL query payload avoiding indexer serialization crashes.
3. **Session-Isolated Secrets**: Private owner secret keys are stored in a scoped in-memory map (`createPrivateStateProvider`), ensuring private keys never leak to disk or server logs.

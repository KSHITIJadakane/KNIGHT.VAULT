# AI Development Rules & Operational Boundaries

These rules are strict guidelines that any AI agent working on this codebase MUST follow.

---

## 1. Midnight Network & SDK Rules

### 1.1. Always Use Low-Level Transaction APIs
* **DO NOT** use high-level `deployContract()` from `@midnight-ntwrk/midnight-js-contracts`. It calls `watchForTxData` internally, which hangs indefinitely when preprod indexers lag.
* **ALWAYS** use low-level `createUnprovenDeployTx` + `submitTxAsync` for contract deployments, and `createUnprovenCallTx` + `submitTxAsync` for circuit invocations.

### 1.2. Always Use the Patched Public Data Provider
* **DO NOT** invoke standard `queryContractState()` without a config parameter against Preprod or Preview networks. The indexer will fail with an `offset: null` GraphQL exception.
* **ALWAYS** use `createPatchedPublicDataProvider` defined in `src/lib/midnight.ts` which requests `contractAction(address: $address) { state }` without passing null offsets.

### 1.3. Token Units & BigInt Precision
* **1 NIGHT = 1,000,000 Stars** (Stars are base units used in all circuit arguments).
* **ALWAYS** represent token amounts as `bigint` inside contract interfaces and SDK calls. Never use JavaScript floating-point numbers for ledger state arithmetic.

### 1.4. Proving Provider & CostModel
* **DO NOT** use `createProofProvider()` from `@midnight-ntwrk/midnight-js-types` (it fails to configure the CostModel properly on browser sessions).
* **ALWAYS** invoke `unprovenTx.prove(provingProvider, CostModel.initialCostModel())` directly inside `proofProvider.proveTx`.

### 1.5. WebAssembly & WebSocket Shims
* The Midnight ledger runtime requires browser WebAssembly and WebSocket shims.
* **ALWAYS** maintain the `isomorphic-ws` resolve alias pointing to `src/lib/isomorphic-ws-fix.mjs` in bundler configurations.
* **ALWAYS** ensure `build.target` is set to `'esnext'` in `vite.config.ts`.

---

## 2. Design & Craft Floor Rules (Impeccable Standards)

* **NO AI Anti-Patterns**:
  * ❌ No purple-to-cyan gradient text (`bg-clip-text text-transparent`).
  * ❌ No decorative zero-blur glowing drop shadows.
  * ❌ No fake decorative badges/sparkles or arbitrary "STEP 1/2/3" eyebrows above clean headings.
  * ❌ No low-contrast gray text on colored buttons/badges.
* **Institutional Aesthetics**:
  * ✅ Matte obsidian/slate surfaces (`#0b0d11`, `#12151c`, borders `#1f242e`).
  * ✅ High-contrast solid typography (`Inter` for functional UI, `JetBrains Mono` with `tabular-nums` for hashes/numbers).
  * ✅ Explicit fee breakdowns and circuit execution descriptions.
* **Validation**:
  * Any UI modification MUST pass `npx -y impeccable detect src/` with **0 anti-patterns**.

---

## 3. Toolchain & Environment Rules

* **Smart Contract Compilation**:
  * `compact` compiler runs natively inside WSL 2 (Ubuntu) at `/home/kshitij/.local/bin/compact`.
  * Contract source lives at `contract/src/payment.compact`.
  * Compilation output lives at `contract/src/managed/payment/`.
* **Asset Synchronization**:
  * Always run `npm run sync:assets` after compiling contracts to mirror `.prover`, `.verifier`, and `.zkir` files to `public/zk/payment/`.

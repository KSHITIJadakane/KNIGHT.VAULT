# Project Requirements Document (PRD)

## 1. Project Title & Overview
**Project Name**: Midnight Privacy Payment Vault DApp  
**Network**: Midnight Blockchain (Preprod / Preview / Local Testnet)  
**Smart Contract Language**: Compact (v0.20+)  
**Purpose**: A non-custodial, privacy-preserving payment vault and escrow application that enables users to deposit tNIGHT tokens, maintain ledger balances, and authorize withdrawals to third-party recipients using Zero-Knowledge (ZK) proofs without revealing private authorization keys on-chain.

---

## 2. Target Users & Personas
* **Web3 & Midnight Developers**: Developers attending workshops or building privacy-first financial primitives on the Midnight network.
* **Escrow & Treasury Managers**: Users requiring programmable fund custody where only authorized secret-key holders can release payouts.
* **DeFi Users & Privacy Enthusiasts**: End-users who demand zero-knowledge transactional anonymity and sponsored zero-gas transactions.

---

## 3. Core Features & Functional Requirements

### 3.1. Wallet & Identity Management
* **Browser Wallet Injection**: Auto-detection of 1AM (`window.midnight['1am']`) and Lace (`window.midnight.mnLace`) browser extensions.
* **Dust-Free Gas Sponsorship**: Sponsorship of network execution fees via `balanceUnsealedTransaction` (0 NIGHT / 0 gas user cost).
* **Parallel Provider Initialization**: Simultaneous retrieval of unshielded address, shielded coin/encryption public keys, and network config.

### 3.2. Smart Contract (Compact) Capabilities
* **Vault Deployment**: Initialization of a fresh `payment.compact` contract instance with on-chain storage of initial ledger counters and derived owner commitment.
* **Deposit Inflow (`receiveUnshielded`)**: Direct deposit of unshielded tNIGHT tokens into contract liquidity pool.
* **Withdraw Outflow (`sendUnshielded`)**: Authorized disbursement of funds to any `UserAddress` verified strictly via a private ZK witness (`ownerKey()`).
* **Persistent Hash Derivation**: Domain-separated owner key derivation `persistentHash([pad(32, "payment:owner:v1"), sk])`.

### 3.3. Real-Time On-Chain State & Analytics
* **Patched GraphQL Indexer Polling**: Real-time state synchronization avoiding preprod `offset: null` bugs.
* **Live Financial Counters**: Real-time calculation of Available Vault Liquidity, Cumulative Inflow (Deposits), and Cumulative Outflow (Withdrawals).
* **Tabular Denomination**: Exact conversions between base units (**Stars**) and human-readable units (**tNIGHT** at 1 NIGHT = 1,000,000 Stars).

### 3.4. Transaction Execution Inspector
* **Step-by-Step Pipeline**: Visual tracking of:
  1. *Parameter Assembly*
  2. *ZK Proving via ProofServer / ProofStation*
  3. *Fee Balancing & 1AM Wallet Signing*
  4. *Chain Broadcast*
  5. *Block Finalization & Indexer Sync*
* **Session Audit Log**: Real-time record of confirmed transactions during the user's active session.

---

## 4. Non-Functional Requirements
* **Performance**: Sub-3-second ZK proof generation via local Proof Engine (port 6300).
* **Security**: Zero leakage of private secret keys on-chain; private states maintained purely in client session memory.
* **Accessibility & Craft**: Strict adherence to Impeccable craft floor standards (0 anti-patterns, no AI visual clichés).

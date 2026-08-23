# 🌌 Midnight Privacy Payment Vault (v0.20)

> A state-of-the-art, privacy-preserving zero-knowledge settlement protocol and institutional vault built on the **Midnight Network**.

[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod-00f5a0?style=for-the-badge&logo=shield)](https://midnight.network)
[![Compact Compiler](https://img.shields.io/badge/Compact-v0.20-818cf8?style=for-the-badge)](https://midnight.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🏛️ Executive Summary

The **Midnight Privacy Payment Vault** is an institutional-grade decentralized application designed for confidential asset custody, anonymous settlements, and zero-gas payer checkouts. By leveraging **Compact Zero-Knowledge smart contracts**, **Halo2 client-side proving**, and **sponsored dust balancing**, sensitive owner keys and transaction witnesses remain 100% private to the client while state transitions are cryptographically verified on-chain.

---

## ✨ Key Capabilities & Architecture

| Feature | Description |
| :--- | :--- |
| 🛡️ **Zero-Knowledge Witness Isolation** | Secret keys and withdrawal authorizations never touch the public ledger. Proving occurs locally on port `:6300`. |
| ⚡ **Dust-Free Gas Sponsorship** | Direct-payer deposits and checkouts require zero pre-funded gas tokens. Fee sponsorship is handled automatically. |
| 🔐 **1AM & Lace Wallet Integration** | Native browser extension connector with preprod provider routing and unshielded/shielded balance sync. |
| 📜 **Cryptographic Audit Receipts** | Generates verifiable QR invoice codes and SHA-256 state receipts for financial compliance. |
| 🎨 **Kinetic Editorial UI** | Inspired by `benjamincreative.me` with cinematic preloader, continuous multi-vector scroll reveals, and spring hover physics. |

---

## 📂 Project Organization

```tree
├── contract/                       # Compact Smart Contract Backend
│   └── src/
│       ├── payment.compact         # Core ZK circuit definition & state machine
│       └── managed/                # Compact compiler artifacts
│           └── payment/
│               ├── compiler/       # TypeScript contract bindings
│               ├── contract/       # Runtime descriptors
│               ├── keys/           # Halo2 ZK proving & verification keys
│               └── zkir/           # Zero-Knowledge Intermediate Representation
│
├── src/                            # Modern Frontend Application
│   ├── components/                 # UI components & interactive widgets
│   │   ├── IntroSplash.tsx         # Cinematic preloader & number counter
│   │   ├── Navbar.tsx              # Institutional navigation & ProofStation status
│   │   ├── VaultMetrics.tsx        # Real-time liquidity, inflow, & outflow analytics
│   │   ├── DepositCard.tsx         # Zero-gas sponsored deposit inflow
│   │   ├── WithdrawCard.tsx        # ZK owner witness withdrawal authorization
│   │   ├── ContractDeployer.tsx    # One-click smart contract instantiation
│   │   ├── DeveloperProfilePopover.tsx # Interactive builder bio popover
│   │   ├── ShowcaseSections.tsx    # Multi-variant kinetic scroll showcase
│   │   ├── ScrollReveal.tsx        # Direction-aware continuous observer engine
│   │   ├── ReceiptModal.tsx        # Cryptographic transaction proof receipt
│   │   └── TransactionStatusModal.tsx # 4-step pipeline execution modal
│   │
│   ├── contexts/
│   │   └── WalletContext.tsx       # 1AM wallet session & state management
│   │
│   ├── lib/
│   │   ├── midnight.ts             # Midnight.js SDK & provider orchestration
│   │   ├── payment.ts              # Contract deployment & circuit call pipeline
│   │   └── sound.ts                # Audio engine utilities
│   │
│   ├── App.tsx                     # Master application controller
│   └── index.css                   # Obsidian theme, spring physics & typography
│
├── public/                         # Static assets & served ZK keys
├── scripts/                        # Synchronization & documentation generators
│   └── sync-assets.mjs             # Synchronizes ZK keys & ZKIR to public folder
└── tools/                          # Compact compiler tools & VS Code extensions
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Docker Desktop**: Required for local proof server
- **1AM Wallet Extension**: Chrome/Brave browser extension for Midnight Network

### 2. Launch Local Proof Server
Start the official Midnight Proof Server container (port 6300):
```bash
docker run -d -p 6300:6300 --name midnight-proof-server \
  ghcr.io/midnight-ntwrk/proof-server:3.0.9
```

### 3. Install Dependencies & Start Dev Server
```bash
# Clone the repository
git clone https://github.com/your-username/midnight-privacy-payment-vault.git
cd midnight-privacy-payment-vault

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

---

## 🛠️ Build & Verification

```bash
# Type check with TypeScript compiler
npx tsc --noEmit

# Synchronize ZK assets & compile production bundle
npm run build
```

---

## 👨‍💻 Developer & Author

* **Architected & Engineered by**: **Kshitij Adakane**
* **Specialization**: Vibe Coder, Embedded Systems & Automotive Engineering, Applied AI/ML.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

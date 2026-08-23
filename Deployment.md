# 🚀 Cloud Deployment Guide: Render (Frontend) + Railway (Backend)

This repository is fully configured for cloud deployment with zero server setup needed.

---

## 🏗️ Architecture Overview

| Component | Cloud Platform | Technology | Configuration Files |
| :--- | :--- | :--- | :--- |
| **Frontend (DApp UI)** | **Render** | Vite + React + Tailwind + ZK WASM | `render.yaml`, `public/_redirects` |
| **Backend (ProofServer)** | **Railway** | Docker `midnightntwrk/proof-server:latest` | `Dockerfile.railway`, `railway.json` |

---

## 🛠️ Step 1: Deploy Backend (ProofServer) on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **"+ New Project"** &rarr; **"Deploy from GitHub repo"**.
3. Select your repository: **`KSHITIJadakane/KNIGHT.VAULT`**.
4. Railway will automatically detect `Dockerfile.railway` and `railway.json`.
5. Under **Settings**:
   - **Networking** &rarr; Click **"Generate Domain"** (e.g. `https://knight-vault-proofserver.up.railway.app`).
   - Ensure the internal port is set to **`6300`**.
6. Copy your public Railway URL (e.g., `https://knight-vault-proofserver.up.railway.app`).

---

## 🌐 Step 2: Deploy Frontend on Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **"New +"** &rarr; **"Static Site"**.
3. Connect your repository: **`KSHITIJadakane/KNIGHT.VAULT`**.
4. Fill in the build settings:
   - **Name**: `knight-vault`
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_PROOF_SERVER_URI`: `https://YOUR-RAILWAY-DOMAIN.up.railway.app`
6. Click **"Create Static Site"**.
7. Render will build and deploy your DApp with automatic SSL and global CDN!

---

## 🔄 Instant Updates & Continuous Delivery (CI/CD)

Whenever you push to the `main` branch:
* **Railway** automatically redeploys the ProofServer container.
* **Render** automatically runs `npm run build` and serves the latest frontend assets.

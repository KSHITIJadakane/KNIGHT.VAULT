# 🚀 Cloud Deployment Guide: Vercel (Frontend) + Railway (Backend)

This repository is pre-configured for 1-click deployment on **Vercel** and **Railway**.

---

## 🏗️ Architecture Overview

| Component | Cloud Platform | Technology | Configuration Files |
| :--- | :--- | :--- | :--- |
| **Frontend (DApp UI)** | **Vercel** | Vite + React + Tailwind + ZK WASM | `vercel.json` |
| **Backend (ProofServer)** | **Railway** | Docker `midnightntwrk/proof-server:latest` | `Dockerfile.railway`, `railway.json` |

---

## 🛠️ Step 1: Backend ProofServer on Railway (Already Active)

* **Public Domain**: `https://knight-vault-frontend-production.up.railway.app`
* **Internal Port**: `6300`

---

## 🌐 Step 2: Deploy Frontend on Vercel (1-Click)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import your repository: **`KSHITIJadakane/KNIGHT.VAULT`**.
4. Vercel will automatically detect `Vite` framework preset from `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Name**: `VITE_PROOF_SERVER_URI`
   - **Value**: `https://knight-vault-frontend-production.up.railway.app`
6. Click **"Deploy"**!

Within ~45 seconds, your DApp will be live on a custom `.vercel.app` domain with global edge caching and instant updates on every `git push`.

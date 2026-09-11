# Smriti (স্মৃতি / स्मृति) — Voice-First AI Dementia Care for NER India

[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20MongoDB%20%7C%20React%20%7C%20Tailwind-2D4A3E?style=for-the-badge)](#)
[![Compliance](https://img.shields.io/badge/Compliance-SIH26003%20%2F%20MDoNER-red?style=for-the-badge)](#)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%207:1%20(AAA)-brightgreen?style=for-the-badge)](#)

> **Voice-first, mobile-responsive AI dementia care web app designed specifically for elderly patients and family caregivers in North Eastern Region (NER) India (SIH26003 / MDoNER).**

## Phase 1 demo-safe updates

This copy was created separately from the original project for SIH demo readiness. It does not require paid API keys for the implemented voice flow.

- Memory Match now gives every cultural pair a distinct visual cue and preserves the final match response when saving the result.
- Patient codes are consistently validated and described as 6–8 alphanumeric characters, including `DEMO01`.
- Sathi provides visible listening, unsupported-browser, permission, no-speech, retry, and typed-message fallback feedback. Browser speech recognition and text-to-speech are used locally when supported.
- SOS visibly states that it is in demo mode and sends no real SMS. It has an in-page failure message, close button, and Escape-to-close support.
- Sathi and SOS dialogs now support Escape-to-close and announce feedback to assistive technologies.

---

## 🏛️ Authentic North Eastern Cultural & Clinical Design
1. **Patient Interface**:
   - **WCAG 7:1 (AAA) Contrast**: High-contrast, dark charcoal on calm cream paper backgrounds (`#FFFDF8`).
   - **NER Handloom Weave Accents**: Authentic Assamese Gamusa red-and-white woven geometric borders, Naga tribal stripe motifs, and Mizo puan touches.
   - **Zero Sensory Confusion**: Strictly **no gradients, no 3D drop-shadows**, keeping visual perception clear and calm for elderly dementia patients.
   - **Huge Touch Targets**: All interactive controls are at least 56px–64px in size for elderly motor stability.
   - **Real-Time IST Rendering**: All timestamps are stored UTC and rendered in **IST (`Asia/Kolkata`, UTC+5:30)**.

2. **Caregiver Interface**:
   - **Sage-Tinted Medical Dashboard**: Clean, calm sage palette (`#2D4A3E`, `#4A6B5D`, `#F4F7F4`).
   - **4 Domain Stat Cards**: Cognitive Composite, Memory Accuracy, Routine Adherence, and Active Alerts.
   - **10-Week Longitudinal Trend Line**: Interactive Recharts chart tracking patient scores over time.
   - **Automated Decline Detection**: Automatically triggers alerts when a rolling 7-day average score drops by **>15 points** compared to the prior 7-day average.
   - **Weekly Digest Email**: HTML health summary preview with Resend API integration (and automatic database queue fallback with status `queued`).

---

## 🧩 4 Adaptive Cognitive Games
1. **Memory Match**: Interactive card pairs featuring authentic NER cultural items and family symbols.
2. **Attention & Focus (Spot-the-Difference)**: Visual odd-one-out and cultural discrimination challenges.
3. **Daily Routine Sequencing**: Drag/tap chronological sequencing of patient's actual routine items (morning tea, bath, medication, lunch, walk, sleep) seeded from their intake survey.
4. **Cultural Recognition (Name-It)**: Quiz with real cultural object photos:
   - **Gamusa (গামোচা)** — Traditional red-and-white woven towel of respect
   - **Chah (অসম চাহ)** — Malty Assam tea in traditional cup
   - **Kothal (কঁঠাল)** — Native sweet jackfruit orchard fruit
   - **Chang Ghar (চাং ঘৰ)** — Mising bamboo stilt house
   - **Dhanesh (ধনেশ)** — Great Indian Hornbill
   - **Bihu Dhol (ঢোল)** — Two-sided Rongali Bihu festival drum
   - **Jaapi (জাপি)** — Traditional conical woven bamboo and leaf sunshade hat

---

## 🎙️ Voice & Sathi AI Companion
- **Bhashini STT & TTS Pipeline**: Supports 9 NER languages (Assamese, Bengali/Sylheti, Bodo, Manipuri/Meitei, Mizo, Khasi, Garo, Nagamese, Hindi/English).
- **Silent Web Speech Fallback**: On any API timeout (>3s), network error, or unsupported language, fails silently to browser Web Speech API without blocking the UI.
- **Sathi Companion Persona**: Grounded in the patient's survey data (family names, favorite foods, places, past career).
- **Distress Guardrails**: If patient conversation indicates distress, fear, or disorientation (e.g., *"where am I"*, *"ভয় লাগিছে"*, *"I am lost"*), Sathi **automatically logs a flagged emergency Alert for the caregiver** and returns an immediate calming, grounding reassurance.

---

## 🚨 Emergency SOS & Geofence
- **Persistent SOS Button**: Present at the top-right of every patient screen.
- **Confirm Modal & Location**: Requests GPS location; on denial, notes *"location unavailable"*.
- **Simulated SMS**: Dispatched immediately to emergency contacts from patient survey.
- **60-Second Debounce**: Prevents accidental panic spamming.
- **Geofence Safe Perimeter**: Configurable center lat/lng and radius (m) with breach simulation and instant warning alerts.

---

## 📴 PWA & Offline Sync
- **Service Worker (`sw.js`)**: Cache-first shell strategy + SWR for instant loading.
- **Offline Banner**: Clear notification when disconnected with pending sync counter.
- **IndexedDB / LocalStorage Queue**: Offline reminder checks and game scores queue automatically and sync on reconnect with **last-write-wins** conflict resolution.

---

## 🔑 Pre-Seeded Evaluation Credentials

See [memory/test_credentials.md](memory/test_credentials.md):

### 1. Demo Caregiver
- **Email**: `caregiver@smriti.in`
- **Password**: `Smriti@2026`
- **Name**: Dr. Ananya Sarmah

### 2. Demo Assamese Patient (Promod Baruah)
- **Patient Code**: `DEMO01`
- **PIN**: `1234`
- **Name**: Promod Baruah (72 years, Jorhat, Assam)
- **Dementia Stage**: Mild Cognitive Impairment (MCI)
- **5 Failed PIN Lockout**: 5 incorrect attempts trigger a 15-minute lockout. Caregivers can reset PIN anytime from the Caregiver Dashboard -> Profile tab.
- **10 Weeks Pre-Seeded History**: Shows a visible score drop (>21 pts) in Memory Match triggering the automated decline alert.

---

## 🚀 How to Run Locally

### 1. Start Backend (FastAPI + MongoDB)
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
> The backend runs on `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.
> Note: If MongoDB service is not running locally, backend seamlessly falls back to `mongomock-motor` in-memory database with zero configuration.

### 2. Run Backend Automated Test Suite
```bash
cd backend
python -m tests.test_api
```

### 3. Start Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
> The frontend dev server runs on `http://localhost:5173`.

---

## 🚢 Cloud Deployment Guide

### Option 1: Render.com (Recommended — Unified 1-Click Service)
Smriti is pre-configured with a multi-stage `Dockerfile` and `render.yaml` Blueprint. Both the React frontend and FastAPI backend run together as a single web service:

1. Push this repository to your GitHub account (`arihantxxjain/smriti`).
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository `arihantxxjain/smriti`.
5. Under **Environment**, choose **Docker** (Render will automatically detect `Dockerfile`).
6. Set the following Environment Variables (optional, defaults are demo-ready):
   - `PORT`: `10000`
   - `MONGO_URL`: `mongodb+srv://...` (or leave blank to use the built-in in-memory database)
   - `JWT_SECRET`: (Click generate)
7. Click **Create Web Service**.
8. Once deployed, Render will provide a live URL (`https://smriti-dementia-care.onrender.com`) serving the entire application!

---

### Option 2: Railway.app (1-Click Docker Deploy)
1. Go to [Railway](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub repo** and select `arihantxxjain/smriti`.
3. Railway automatically detects `Dockerfile` and builds both frontend and backend.
4. Add a domain in Service Settings -> Networking -> Generate Domain.

---

### Option 3: Docker Compose (Local / VPS / EC2)
Run the entire production stack locally or on a cloud VPS with MongoDB included:
```bash
docker-compose up --build -d
```
Access the application at `http://localhost:8000`.


# Smriti (স্মৃতি / स्मृति) — Voice-First AI Dementia Care for NER India

[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20MongoDB%20%7C%20React%20%7C%20Tailwind-2D4A3E?style=for-the-badge)](#)
[![Compliance](https://img.shields.io/badge/Compliance-SIH26003%20%2F%20MDoNER-red?style=for-the-badge)](#)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%207:1%20(AAA)-brightgreen?style=for-the-badge)](#)

> **Voice-first, mobile-responsive AI dementia care web app designed specifically for elderly patients and family caregivers in North Eastern Region (NER) India (SIH26003 / MDoNER).**

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

## 🚀 How to Run the Project

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

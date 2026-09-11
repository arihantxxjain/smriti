# Smriti Frontend (স্মৃতি / स्मृति) — Voice-First AI Dementia Care Web App

[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%207%3A1%20(AAA)-brightgreen)](#)
[![SIH26003](https://img.shields.io/badge/SIH-SIH26003%20%2F%20MDoNER-red.svg)](#)

Mobile-responsive, voice-first Progressive Web Application (PWA) designed for elderly dementia patients and family caregivers in North Eastern Region (NER) India. Built for Smart India Hackathon (SIH26003 / MDoNER).

---

## 🏛️ Authentic North Eastern Cultural & Clinical Design

1. **Elderly Patient Interface**:
   - **WCAG 7:1 (AAA) Contrast**: High-contrast, dark charcoal on calm cream paper backgrounds (`#FFFDF8`).
   - **Authentic NER Motifs**: Assamese Gamusa red-and-white woven borders, Naga tribal stripes, and Mizo puan accents.
   - **Zero Sensory Confusion**: Strictly zero gradients and no 3D drop-shadows to ensure visual clarity and prevent visual hallucinations.
   - **Large Touch Targets**: 56px–64px minimum touch targets for motor-impaired elderly users.
   - **IST Time Rendering**: Real-time rendering in Indian Standard Time (`Asia/Kolkata`, UTC+5:30).

2. **Caregiver Clinical Dashboard**:
   - Sage-tinted clinical palette (`#2D4A3E`, `#4A6B5D`, `#F4F7F4`).
   - Longitudinal 10-week cognitive trend lines powered by Recharts.
   - Domain composite scorecards: Memory Accuracy, Attention, Routine Adherence, and Active Decline Alerts.

---

## 🧩 4 Adaptive Cognitive Games

1. **Memory Match**: Interactive card pairs featuring authentic NER cultural items and family symbols.
2. **Attention & Focus**: Spot-the-difference challenges and cultural discrimination puzzles.
3. **Daily Routine Sequencing**: Chronological timeline sequencing for daily tasks (morning tea, bath, medication, walk, sleep).
4. **Cultural Recognition (Name-It)**: Quiz recognizing authentic regional items:
   - *Gamusa (গামোচা)* — Traditional woven towel of respect
   - *Chah (অসম চাহ)* — Malty Assam tea
   - *Kothal (কঁঠাল)* — Sweet jackfruit
   - *Chang Ghar (চাং ঘৰ)* — Mising bamboo stilt house
   - *Dhanesh (ধনেশ)* — Great Indian Hornbill
   - *Bihu Dhol (ঢোল)* — Rongali Bihu festival drum
   - *Jaapi (জাপি)* — Conical bamboo sunshade hat

---

## 🎙️ Sathi Voice AI Companion & Safety Guardrails

- **Voice Interaction**: Built-in speech recognition and speech synthesis with automatic fallback to browser Web Speech API.
- **Distress Guardrail**: Detects expressions of fear, disorientation, or distress (e.g., *"where am I"*, *"ভয় লাগিছে"*, *"I am scared"*), soothing the patient while notifying the caregiver.
- **Emergency SOS**: Prominent panic button with geolocation capture and 60-second debounce.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Built production assets will be generated in `dist/`.

---

## 👥 Demo Evaluation Credentials
- **Patient Login**: Code `DEMO01` / PIN `1234`
- **Caregiver Login**: `caregiver@smriti.in` / `Smriti@2026`

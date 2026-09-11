# Smriti Backend (স্মৃতি / स्मृति) — Voice-First AI Dementia Care API

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-green.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org)
[![SIH26003](https://img.shields.io/badge/SIH-SIH26003%20%2F%20MDoNER-red.svg)](#)

FastAPI REST backend and database services for **Smriti**, a voice-first, culturally-grounded AI dementia care platform designed for elderly patients and family caregivers in North Eastern Region (NER) India.

---

## 🏗️ Architecture & Features

- **Authentication & Roles**:
  - Caregiver JWT authentication (bcrypt password hashing).
  - Elderly-friendly 4-digit PIN authentication with lockout protection (5 failed attempts trigger a 15-minute lockout).
- **Longitudinal Cognitive Tracking**:
  - Pre-seeded and live session analytics across 4 cognitive domains (Memory Match, Attention & Focus, Routine Sequencing, Cultural Recognition).
  - Automated Cognitive Decline Detection (triggers high-severity caregiver alert on >15 point rolling score drops).
- **Sathi Voice AI Companion**:
  - Conversational companion grounded in patient personal history.
  - Distress guardrails: Flags caregiver emergency alert when detecting phrases like "where am I", "ভয় লাগিছে", or "I am scared".
- **Emergency SOS Dispatch**:
  - Endpoint for patient panic triggers with browser GPS coordinates and 60-second debounce prevention.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- MongoDB instance (local or MongoDB Atlas connection URI)

### 2. Setup Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root of `backend/`:
```env
MONGO_URL=mongodb://localhost:27017/smriti
JWT_SECRET=your-secret-key-at-least-32-characters
PORT=8000
```

### 5. Run the Server
```bash
# Using run script
python run.py

# Or directly with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🧪 Testing

Run automated tests:
```bash
pytest
```

---

## 👥 Evaluation & Demo Access
- **Demo Caregiver**: `caregiver@smriti.in` / `Smriti@2026`
- **Demo Patient**: Code `DEMO01` / PIN `1234`

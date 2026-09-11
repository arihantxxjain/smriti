
## Update — 2026-09-11: Sathi voice assistant "no response" bug RESOLVED
- Root cause: supervisor `backend` launched `uvicorn server:app` but the project entry is `app.main:app`; import failed → `/api` down → Sathi couldn't respond ("API doesn't work").
- Fixes applied:
  - Created `/app/backend/server.py` re-exporting `from app.main import app` (satisfies supervisor `server:app` on :8001).
  - Added `"start": "vite --host 0.0.0.0 --port 3000"` to `frontend/package.json`; set `vite.config.js` host 0.0.0.0:3000, `allowedHosts: true`, `/api` + `/uploads` proxy → `127.0.0.1:8001`.
  - Added `GROQ_API_KEY` to `backend/.env`; `sathi.py` uses Groq model `groq/compound-mini` (spec's `llama-3.3-70b-versatile` is decommissioned for this key), 2.5s timeout, offline intent-matcher fallback.
  - Installed `mongomock-motor` into runtime venv.
- Verified by testing_agent (iteration_1.json): 100% backend & frontend; 3 dynamic Groq replies + distress guardrail. Not reproducible.
- Known notes (non-blocking): frontend uses `import.meta.env.VITE_BACKEND_URL || '/api'` (not platform `REACT_APP_BACKEND_URL`) — relies on same-origin `/api`; will need the `/api` route in any external deploy.

## Update — 2026-09-11: Upload storage migrated to Emergent object storage (deploy-readiness)
- `backend/app/routers/upload.py` no longer writes to pod disk. It now PUTs image bytes to Emergent object storage (path `smriti/uploads/{user_id}/{uuid}.{ext}`), records a doc in `db.files`, and serves via GET `/api/upload/file/{file_id}`.
- Added `EMERGENT_LLM_KEY` to `backend/.env`; `config.py` now exposes `EMERGENT_LLM_KEY` + `INTEGRATION_PROXY_URL`.
- Frontend unchanged: it stores the returned `url` as `photo_url` and renders it in `<img src>` (same-origin, works via ingress).
- Verified end-to-end through public ingress: caregiver login → POST /api/upload → GET served file (200, image/png, byte-identical).

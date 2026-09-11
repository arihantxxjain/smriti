import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from bson.errors import InvalidId

from app.config import settings
from app.database import init_db
from app.seed import seed_database
from app.routers import auth, patients, surveys, games, reminders, memories, facts, alerts, sathi, digest, upload

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("smriti.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smriti backend database...")
    await init_db()
    try:
        await seed_database()
        logger.info("Database initialized and demo seed verified.")
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
    yield
    logger.info("Smriti backend shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Voice-first, mobile-responsive AI dementia care web app for elderly patients in NER India",
    version="1.0.0",
    lifespan=lifespan
)

cors_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add permissive security headers to all responses.
    This fulfills the request to allow all relevant permissions.
    """
    response = await call_next(request)
    response.headers["Permissions-Policy"] = "geolocation=*, microphone=*, autoplay=*, clipboard-write=*, fullscreen=*, camera=*, payment=*, sync-xhr=*, accelerometer=*, ambient-light-sensor=*, battery=*, display-capture=*, document-domain=*, encrypted-media=*, execution-while-not-rendered=*, focus-without-user-activation=*, gyroscope=*, magnetometer=*, midi=*, navigation-override=*, picture-in-picture=*, publickey-credentials-get=*, screen-wake-lock=*, usb=*, vr=*, wake-lock=*, xr-spatial-tracking=*"
    response.headers["Content-Security-Policy"] = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; connect-src *; font-src * data:;"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "ALLOWALL"
    return response

@app.exception_handler(InvalidId)
async def invalid_id_handler(request, exc):
    return JSONResponse(status_code=400, content={"detail": "Invalid resource ID format"})

# Ensure upload directory exists and mount static files
os.makedirs(settings.EMERGENT_STORAGE_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.EMERGENT_STORAGE_PATH), name="uploads")

# Mount API Routers under /api prefix
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(patients.router, prefix=settings.API_PREFIX)
app.include_router(surveys.router, prefix=settings.API_PREFIX)
app.include_router(games.router, prefix=settings.API_PREFIX)
app.include_router(reminders.router, prefix=settings.API_PREFIX)
app.include_router(memories.router, prefix=settings.API_PREFIX)
app.include_router(facts.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(sathi.router, prefix=settings.API_PREFIX)
app.include_router(digest.router, prefix=settings.API_PREFIX)
app.include_router(upload.router, prefix=settings.API_PREFIX)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "region": "North Eastern Region (NER) India",
        "compliance": "SIH26003 / MDoNER"
    }

# Multi-path search for built frontend dist (works locally, in Docker, and on Render)
possible_dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist")),
    os.path.abspath("/app/frontend/dist"),
    os.path.abspath("./frontend/dist"),
    os.path.abspath("../frontend/dist")
]
frontend_dist = next((p for p in possible_dist_paths if os.path.isdir(p)), None)

if frontend_dist:
    logger.info(f"Serving built React frontend from: {frontend_dist}")
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

    @app.exception_handler(404)
    async def spa_fallback(request, exc):
        if request.url.path.startswith("/api"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Not found"})
else:
    logger.warning("Frontend dist directory not found. API routes are active.")

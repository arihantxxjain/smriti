"""Supervisor entrypoint shim: exposes the Smriti FastAPI app as `server:app`."""
from app.main import app  # noqa: F401

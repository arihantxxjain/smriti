import os
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Response
from app.auth import get_current_user
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

STORAGE_BASE = (settings.INTEGRATION_PROXY_URL or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = settings.EMERGENT_LLM_KEY
APP_NAME = "smriti"

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif"}
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp"
}

_storage_key = None


async def init_storage(force: bool = False) -> str:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY})
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
    return _storage_key


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as client:
        url = f"{STORAGE_URL}/objects/{path}"
        headers = {"X-Storage-Key": key, "Content-Type": content_type}
        resp = await client.put(url, headers=headers, content=data)
        if resp.status_code == 404:
            key = await init_storage(force=True)
            headers["X-Storage-Key"] = key
            resp = await client.put(url, headers=headers, content=data)
        resp.raise_for_status()
        return resp.json()


async def get_object(path: str):
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as client:
        url = f"{STORAGE_URL}/objects/{path}"
        resp = await client.get(url, headers={"X-Storage-Key": key})
        if resp.status_code == 404:
            key = await init_storage(force=True)
            resp = await client.get(url, headers={"X-Storage-Key": key})
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


@router.post("")
async def upload_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    filename = file.filename or "upload.jpg"
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed")

    contents = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")

    file_id = uuid.uuid4().hex
    user_id = current_user.get("id") or "shared"
    storage_path = f"{APP_NAME}/uploads/{user_id}/{file_id}.{ext}"

    try:
        result = await put_object(storage_path, contents, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upload failed: {e}")

    db = get_db()
    await db.files.insert_one({
        "file_id": file_id,
        "storage_path": result.get("path", storage_path),
        "original_filename": filename,
        "content_type": content_type,
        "size": result.get("size", len(contents)),
        "uploaded_by": user_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "url": f"/api/upload/file/{file_id}",
        "filename": file_id,
        "original_name": filename,
        "size_bytes": len(contents)
    }


@router.get("/file/{file_id}")
async def serve_file(file_id: str):
    db = get_db()
    record = await db.files.find_one({"file_id": file_id, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = await get_object(record["storage_path"])
    except Exception:
        raise HTTPException(status_code=404, detail="File not available")
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={"Cache-Control": "public, max-age=31536000"}
    )

import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = os.path.abspath(settings.EMERGENT_STORAGE_PATH)
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Validate extension
    filename = file.filename or "upload.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Only image files (.jpg, .jpeg, .png, .webp) are allowed")
    
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return accessible URL
    url = f"/uploads/{unique_filename}"
    return {
        "url": url,
        "filename": unique_filename,
        "original_name": filename,
        "size_bytes": len(contents)
    }

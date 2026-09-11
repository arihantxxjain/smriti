from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import MemoryCreate
from bson import ObjectId

router = APIRouter(prefix="/memories", tags=["memories"])

@router.get("/{patient_id}")
async def get_patient_memories(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.memories.find({"patient_id": patient_id}).sort("created_at", -1)
    memories = []
    async for m in cursor:
        memories.append(serialize_doc(m))
    return memories

@router.post("/{patient_id}")
async def create_memory(patient_id: str, payload: MemoryCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now_utc = datetime.now(timezone.utc).isoformat()
    doc = {
        "patient_id": patient_id,
        "title": payload.title.strip(),
        "photo_url": payload.photo_url.strip(),
        "caption": payload.caption.strip(),
        "person_event": payload.person_event.strip(),
        "approx_year_or_date": payload.approx_year_or_date or "",
        "tts_text": payload.tts_text or payload.caption,
        "created_at": now_utc
    }
    result = await db.memories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return serialize_doc(doc)

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.memories.delete_one({"_id": ObjectId(memory_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted successfully"}

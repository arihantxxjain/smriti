from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import FactCreate
from bson import ObjectId

router = APIRouter(prefix="/facts", tags=["facts"])

@router.get("/{patient_id}")
async def get_patient_facts(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.facts.find({"patient_id": patient_id}).sort("created_at", -1)
    facts = []
    async for f in cursor:
        facts.append(serialize_doc(f))
    return facts

@router.post("/{patient_id}")
async def create_fact(patient_id: str, payload: FactCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now_utc = datetime.now(timezone.utc).isoformat()
    doc = {
        "patient_id": patient_id,
        "category": payload.category,
        "content": payload.content.strip(),
        "created_at": now_utc
    }
    result = await db.facts.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return serialize_doc(doc)

@router.delete("/{fact_id}")
async def delete_fact(fact_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.facts.delete_one({"_id": ObjectId(fact_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fact not found")
    return {"message": "Fact deleted successfully"}

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_caregiver

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/{patient_id}")
async def get_patient_audit_logs(patient_id: str, limit: int = 50, current_caregiver: dict = Depends(get_current_caregiver)):
    db = get_db()
    cursor = db.audit_logs.find({"patient_id": patient_id}).sort("timestamp", -1).limit(limit)
    logs = []
    async for entry in cursor:
        logs.append(serialize_doc(entry))
    return logs

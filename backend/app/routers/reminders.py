from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import ReminderCreate, ReminderToggle
from bson import ObjectId

router = APIRouter(prefix="/reminders", tags=["reminders"])

@router.get("/{patient_id}")
async def get_patient_reminders(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.reminders.find({"patient_id": patient_id, "active": True}).sort("time_str", 1)
    reminders = []
    async for r in cursor:
        reminders.append(serialize_doc(r))
    return reminders

@router.post("")
async def create_reminder(payload: ReminderCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    now_utc = datetime.now(timezone.utc).isoformat()
    doc = {
        "patient_id": current_user.get("id") if current_user.get("role") == "patient" else payload.patient_id,
        "title": payload.title.strip(),
        "time_str": payload.time_str,
        "category": payload.category,
        "completed_dates": [],
        "active": payload.active,
        "created_at": now_utc
    }
    result = await db.reminders.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return serialize_doc(doc)

@router.put("/{reminder_id}/toggle")
async def toggle_reminder(reminder_id: str, payload: ReminderToggle, current_user: dict = Depends(get_current_user)):
    db = get_db()
    reminder = await db.reminders.find_one({"_id": ObjectId(reminder_id)})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    completed_dates = set(reminder.get("completed_dates", []))
    if payload.completed:
        completed_dates.add(payload.date_str)
    else:
        completed_dates.discard(payload.date_str)

    new_list = sorted(list(completed_dates))
    await db.reminders.update_one(
        {"_id": reminder["_id"]},
        {"$set": {"completed_dates": new_list, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    reminder["completed_dates"] = new_list
    return serialize_doc(reminder)

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.reminders.delete_one({"_id": ObjectId(reminder_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted successfully"}

@router.post("/sync")
async def batch_sync_reminders(actions: List[Dict[str, Any]], current_user: dict = Depends(get_current_user)):
    db = get_db()
    synced_count = 0
    now_utc = datetime.now(timezone.utc).isoformat()

    for item in actions:
        reminder_id = item.get("reminder_id")
        date_str = item.get("date_str")
        completed = item.get("completed", False)
        if reminder_id and date_str:
            try:
                rem = await db.reminders.find_one({"_id": ObjectId(reminder_id)})
                if rem:
                    dates = set(rem.get("completed_dates", []))
                    if completed:
                        dates.add(date_str)
                    else:
                        dates.discard(date_str)
                    await db.reminders.update_one(
                        {"_id": rem["_id"]},
                        {"$set": {"completed_dates": sorted(list(dates)), "updated_at": now_utc}}
                    )
                    synced_count += 1
            except Exception:
                continue

    return {"status": "synced", "count": synced_count}

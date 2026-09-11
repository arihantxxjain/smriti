import random
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db, serialize_doc
from app.auth import get_current_caregiver, get_current_user, hash_pin
from app.schemas import PatientCreate, PatientPINReset, GeofenceSchema
from bson import ObjectId

router = APIRouter(prefix="/patients", tags=["patients"])

def generate_patient_code() -> str:
    chars = string.ascii_uppercase + string.digits
    clean_chars = [c for c in chars if c not in ('O', '0', 'I', '1')]
    return "".join(random.choices(clean_chars, k=8))

@router.get("")
async def list_patients(current_caregiver: dict = Depends(get_current_caregiver)):
    db = get_db()
    caregiver_id = ObjectId(current_caregiver["id"])
    cursor = db.patients.find({"caregiver_id": caregiver_id})
    patients = []
    async for raw_p in cursor:
        p = serialize_doc(raw_p)
        p.pop("pin_hash", None)
        
        # Get latest active alert count
        active_alerts = await db.alerts.count_documents({"patient_id": p["id"], "dismissed": False})
        p["active_alerts_count"] = active_alerts

        # Get latest game session composite score
        latest_game = await db.game_sessions.find_one({"patient_id": p["id"]}, sort=[("timestamp", -1)])
        p["latest_score"] = latest_game.get("composite_score", 0) if latest_game else None
        
        patients.append(p)
    return patients

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate, current_caregiver: dict = Depends(get_current_caregiver)):
    db = get_db()
    
    if not payload.consent_flag:
        raise HTTPException(
            status_code=400,
            detail="Caregiver consent attestation is required on behalf of the patient to proceed."
        )

    code = ""
    for _ in range(10):
        test_code = generate_patient_code()
        existing = await db.patients.find_one({"code": test_code})
        if not existing:
            code = test_code
            break
    if not code:
        code = f"SM{random.randint(100000, 999999)}"

    caregiver_id = ObjectId(current_caregiver["id"])
    now_utc = datetime.now(timezone.utc).isoformat()

    patient_doc = {
        "name": payload.name.strip(),
        "dob": payload.dob,
        "dementia_stage": payload.dementia_stage,
        "language": payload.language,
        "code": code,
        "pin_hash": hash_pin(payload.pin),
        "failed_login_attempts": 0,
        "lockout_until": None,
        "caregiver_id": caregiver_id,
        "geofence": payload.geofence.model_dump() if payload.geofence else {
            "center_lat": 26.7509,
            "center_lng": 94.2037,
            "radius_m": 500.0
        },
        "consent_flag": payload.consent_flag,
        "consent_timestamp": now_utc,
        "created_at": now_utc
    }

    result = await db.patients.insert_one(patient_doc)
    patient_id = str(result.inserted_id)

    survey_data = payload.survey.model_dump() if payload.survey else {
        "basic": {
            "name": payload.name,
            "dob": payload.dob,
            "gender": "other",
            "native_language": payload.language,
            "years_of_education": 12
        },
        "cognitive_baseline": {
            "diagnosed_stage": payload.dementia_stage,
            "diagnosis_date": now_utc[:10],
            "triggers_confusion_patterns": ""
        },
        "family_context": [],
        "daily_routine": {
            "wake_time": "06:30",
            "sleep_time": "21:30",
            "meal_times": ["08:00", "13:00", "20:00"],
            "medication_schedule": ["08:30 (Morning)", "20:30 (Night)"]
        },
        "interests_history": {
            "hobbies": ["gardening", "traditional crafts"],
            "former_occupation": "Homemaker",
            "favorite_places": ["Home"],
            "favorite_foods": ["Rice", "Dal"]
        },
        "safety": {
            "wandering_risk": False,
            "mobility_level": "independent",
            "emergency_contact_name": current_caregiver.get("name", "Caregiver"),
            "emergency_contact_phone": current_caregiver.get("phone", "")
        }
    }
    survey_data["patient_id"] = patient_id
    survey_data["updated_at"] = now_utc
    await db.patient_surveys.insert_one(survey_data)

    daily_routine = survey_data.get("daily_routine", {})
    reminders_to_insert = []
    for med in daily_routine.get("medication_schedule", []):
        time_part = med.split(" ")[0] if " " in med else "09:00"
        reminders_to_insert.append({
            "patient_id": patient_id,
            "title": f"Take Medication: {med}",
            "time_str": time_part,
            "category": "medication",
            "completed_dates": [],
            "active": True,
            "created_at": now_utc
        })
    for idx, meal in enumerate(daily_routine.get("meal_times", [])):
        meal_name = ["Breakfast", "Lunch", "Dinner"][idx] if idx < 3 else "Meal"
        reminders_to_insert.append({
            "patient_id": patient_id,
            "title": f"{meal_name} time",
            "time_str": meal,
            "category": "meal",
            "completed_dates": [],
            "active": True,
            "created_at": now_utc
        })
    if reminders_to_insert:
        await db.reminders.insert_many(reminders_to_insert)

    clean_p = serialize_doc(patient_doc)
    clean_p.pop("pin_hash", None)
    clean_p["id"] = patient_id
    return clean_p

@router.get("/{patient_id}")
async def get_patient_detail(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user["role"] == "caregiver":
        if str(patient["caregiver_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized access to patient")
    elif current_user["role"] == "patient":
        if str(patient["_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized access")
    
    clean_p = serialize_doc(patient)
    clean_p.pop("pin_hash", None)

    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    if survey:
        clean_p["survey"] = serialize_doc(survey)

    return clean_p

@router.post("/{patient_id}/reset-pin")
async def reset_patient_pin(
    patient_id: str, 
    payload: PatientPINReset, 
    current_caregiver: dict = Depends(get_current_caregiver)
):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id), "caregiver_id": ObjectId(current_caregiver["id"])})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
    
    if not payload.new_pin.isdigit() or len(payload.new_pin) not in (4, 6):
        raise HTTPException(status_code=400, detail="PIN must be 4 or 6 numeric digits")
    
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {"$set": {
            "pin_hash": hash_pin(payload.new_pin),
            "failed_login_attempts": 0,
            "lockout_until": None
        }}
    )
    return {"message": "Patient PIN reset successfully, lockout cleared"}

@router.put("/{patient_id}/geofence")
async def update_geofence(
    patient_id: str,
    payload: GeofenceSchema,
    current_caregiver: dict = Depends(get_current_caregiver)
):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id), "caregiver_id": ObjectId(current_caregiver["id"])})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
    
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {"$set": {"geofence": payload.model_dump()}}
    )
    return {"message": "Geofence updated successfully", "geofence": payload.model_dump()}

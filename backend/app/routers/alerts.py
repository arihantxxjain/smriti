from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import SOSCreate, AlertUpdate
from bson import ObjectId

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/sos")
async def trigger_sos(payload: SOSCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient_id = payload.patient_id
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Debounce: check for active SOS alert within last 60 seconds
    sixty_seconds_ago = (now - timedelta(seconds=60)).isoformat()
    recent_sos = await db.alerts.find_one({
        "patient_id": patient_id,
        "type": "SOS",
        "timestamp": {"$gte": sixty_seconds_ago}
    })
    if recent_sos:
        return {
            "message": "SOS already active. An emergency alert was sent within the last 60 seconds.",
            "debounced": True,
            "alert_id": str(recent_sos["_id"])
        }

    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    patient_name = patient.get("name", "Patient") if patient else "Patient"
    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    safety = survey.get("safety", {}) if survey else {}
    emergency_phone = safety.get("emergency_contact_phone") or "Caregiver"
    emergency_name = safety.get("emergency_contact_name") or "Caregiver"

    loc_str = "Location unavailable (permission denied or GPS off)" if (payload.location_unavailable or payload.lat is None) else f"Lat {round(payload.lat, 5)}, Lng {round(payload.lng, 5)}"

    simulated_sms_body = (
        f"CRITICAL SMRITI SOS: {patient_name} pressed the Emergency SOS button at {now_iso[:19]} UTC! "
        f"Location: {loc_str}. Please check on them immediately."
    )

    alert_doc = {
        "patient_id": patient_id,
        "type": "SOS",
        "severity": "critical",
        "read": False,
        "dismissed": False,
        "timestamp": now_iso,
        "resolved_by": None,
        "details": {
            "location_unavailable": payload.location_unavailable or (payload.lat is None),
            "lat": payload.lat,
            "lng": payload.lng,
            "location_text": loc_str,
            "notes": payload.notes,
            "simulated_sms": simulated_sms_body,
            "simulated_sms_sent_to": f"{emergency_name} ({emergency_phone})"
        }
    }
    result = await db.alerts.insert_one(alert_doc)
    alert_doc["id"] = str(result.inserted_id)

    return {
        "message": "SOS alert registered and emergency contact notified.",
        "debounced": False,
        "alert": serialize_doc(alert_doc)
    }

@router.post("/geofence")
async def trigger_geofence_alert(payload: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient_id = payload.get("patient_id")
    lat = payload.get("lat")
    lng = payload.get("lng")
    distance_m = payload.get("distance_m", 650)
    
    now_iso = datetime.now(timezone.utc).isoformat()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    patient_name = patient.get("name", "Patient") if patient else "Patient"

    alert_doc = {
        "patient_id": patient_id,
        "type": "geofence",
        "severity": "high",
        "read": False,
        "dismissed": False,
        "timestamp": now_iso,
        "resolved_by": None,
        "details": {
            "reason": f"Patient wandered outside safe boundary ({distance_m}m from safe center).",
            "lat": lat,
            "lng": lng,
            "distance_m": distance_m,
            "simulated_sms": f"GEOFENCE ALERT: {patient_name} is outside designated safe perimeter ({distance_m}m). Current location: Lat {lat}, Lng {lng}."
        }
    }
    result = await db.alerts.insert_one(alert_doc)
    alert_doc["id"] = str(result.inserted_id)
    return serialize_doc(alert_doc)

@router.get("/patient/{patient_id}")
async def get_patient_alerts(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.alerts.find({"patient_id": patient_id}).sort("timestamp", -1)
    alerts = []
    async for a in cursor:
        alerts.append(serialize_doc(a))
    return alerts

@router.put("/{alert_id}")
async def update_alert(alert_id: str, payload: AlertUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    update_data = {}
    if payload.read is not None:
        update_data["read"] = payload.read
    if payload.dismissed is not None:
        update_data["dismissed"] = payload.dismissed
    if payload.resolved_by is not None:
        update_data["resolved_by"] = payload.resolved_by
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.alerts.find_one_and_update(
        {"_id": ObjectId(alert_id)},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return serialize_doc(result)

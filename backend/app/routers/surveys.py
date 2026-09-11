from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import PatientSurveySchema
from bson import ObjectId

router = APIRouter(prefix="/surveys", tags=["surveys"])

@router.get("/{patient_id}")
async def get_patient_survey(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found for this patient")
    return serialize_doc(survey)

@router.put("/{patient_id}")
async def update_patient_survey(
    patient_id: str,
    payload: PatientSurveySchema,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "caregiver":
        raise HTTPException(status_code=403, detail="Only caregivers can update patient surveys")

    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id), "caregiver_id": ObjectId(current_user["id"])})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")

    now_utc = datetime.now(timezone.utc).isoformat()
    survey_data = payload.model_dump()
    survey_data["patient_id"] = patient_id
    survey_data["updated_at"] = now_utc

    await db.patient_surveys.update_one(
        {"patient_id": patient_id},
        {"$set": survey_data},
        upsert=True
    )

    await db.patients.update_one(
        {"_id": ObjectId(patient_id)},
        {"$set": {
            "name": payload.basic.name,
            "dob": payload.basic.dob,
            "language": payload.basic.native_language,
            "dementia_stage": payload.cognitive_baseline.diagnosed_stage
        }}
    )

    return {"message": "Patient survey updated successfully", "survey": survey_data}

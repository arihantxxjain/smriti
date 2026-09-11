from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
import httpx
from app.database import get_db
from app.auth import get_current_caregiver
from app.config import settings
from bson import ObjectId

router = APIRouter(prefix="/digest", tags=["digest"])

def build_digest_html(patient: dict, recent_scores: list, alerts: list, reminders: list) -> str:
    avg_score = round(sum(recent_scores) / len(recent_scores), 1) if recent_scores else 0
    name = patient.get("name", "Elder")
    code = patient.get("code", "")
    stage = patient.get("dementia_stage", "mild").capitalize()
    
    alert_rows = "".join([
        f"<li style='margin-bottom:8px;'><strong>{a.get('type').upper()}</strong> ({a.get('severity')}): {a.get('details', {}).get('reason', a.get('details', {}).get('notes', 'Incident registered'))} - <em>{a.get('timestamp')[:10]}</em></li>"
        for a in alerts[:5]
    ]) if alerts else "<li>No critical alerts logged this week. Excellent!</li>"

    reminder_rows = "".join([
        f"<li style='margin-bottom:6px;'>{r.get('title')} at {r.get('time_str')}</li>"
        for r in reminders[:5]
    ]) if reminders else "<li>No reminders configured.</li>"

    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background-color: #2D4A3E; color: #FFFFFF; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">Smriti • Weekly Dementia Care Digest</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Patient Health & Cognitive Summary for Caregivers</p>
        </div>
        
        <div style="padding: 24px; color: #1E293B;">
            <div style="background: #F4F7F4; border-left: 4px solid #4A6B5D; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 15px;"><strong>Patient:</strong> {name} (ID: <code>{code}</code>)</p>
                <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Stage:</strong> {stage} Cognitive Impairment | <strong>Region:</strong> Assam / NER</p>
            </div>

            <h3 style="color: #2D4A3E; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;">1. Cognitive Activity Summary</h3>
            <div style="display: flex; gap: 16px; margin: 16px 0;">
                <div style="flex: 1; background: #FAFDFB; border: 1px solid #D1E7DD; border-radius: 8px; padding: 16px; text-align: center;">
                    <span style="font-size: 28px; font-weight: bold; color: #2D4A3E;">{avg_score}</span>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748B;">7-Day Avg Score / 100</p>
                </div>
                <div style="flex: 1; background: #FAFDFB; border: 1px solid #D1E7DD; border-radius: 8px; padding: 16px; text-align: center;">
                    <span style="font-size: 28px; font-weight: bold; color: #2D4A3E;">{len(recent_scores)}</span>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748B;">Games Completed</p>
                </div>
            </div>

            <h3 style="color: #2D4A3E; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px; margin-top: 24px;">2. Alerts & Safety Monitor</h3>
            <ul style="padding-left: 20px; font-size: 14px; color: #334155;">
                {alert_rows}
            </ul>

            <h3 style="color: #2D4A3E; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px; margin-top: 24px;">3. Key Active Routines & Reminders</h3>
            <ul style="padding-left: 20px; font-size: 14px; color: #334155;">
                {reminder_rows}
            </ul>

            <div style="margin-top: 30px; padding: 12px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; font-size: 12px; color: #92400E;">
                <strong>Clinical Note:</strong> Demo data — not for clinical use. Smriti cognitive tracking is designed to assist family caregivers and support medical consultations.
            </div>
        </div>
        
        <div style="background: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0;">
            Smriti Dementia Care Platform • Ministry of Development of North Eastern Region (MDoNER / SIH26003)
        </div>
    </div>
    """

@router.get("/preview/{patient_id}")
async def preview_digest(patient_id: str, current_caregiver: dict = Depends(get_current_caregiver)):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id), "caregiver_id": ObjectId(current_caregiver["id"])})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    sessions = db.game_sessions.find({"patient_id": patient_id, "timestamp": {"$gte": seven_days_ago}})
    scores = [s.get("composite_score", 0) async for s in sessions]

    alerts_cur = db.alerts.find({"patient_id": patient_id}).sort("timestamp", -1).limit(5)
    alerts = [a async for a in alerts_cur]

    reminders_cur = db.reminders.find({"patient_id": patient_id, "active": True}).limit(5)
    reminders = [r async for r in reminders_cur]

    html_content = build_digest_html(patient, scores, alerts, reminders)
    return {
        "patient_name": patient.get("name"),
        "html": html_content,
        "recipient_email": current_caregiver.get("email")
    }

@router.post("/send/{patient_id}")
async def send_digest(patient_id: str, current_caregiver: dict = Depends(get_current_caregiver)):
    db = get_db()
    patient = await db.patients.find_one({"_id": ObjectId(patient_id), "caregiver_id": ObjectId(current_caregiver["id"])})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")

    preview_res = await preview_digest(patient_id, current_caregiver)
    html_content = preview_res["html"]
    recipient = current_caregiver.get("email")
    now_iso = datetime.now(timezone.utc).isoformat()

    status_str = "queued"
    sent_via = "simulated_queue"

    if settings.RESEND_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": "Smriti Care <care@smriti.in>",
                        "to": [recipient],
                        "subject": f"Smriti Weekly Care Digest: {patient.get('name')}",
                        "html": html_content
                    }
                )
                if res.status_code in (200, 201):
                    status_str = "sent"
                    sent_via = "resend"
        except Exception:
            status_str = "queued"
            sent_via = "simulated_queue"

    # Store digest record in DB
    digest_doc = {
        "patient_id": patient_id,
        "caregiver_id": current_caregiver["id"],
        "recipient": recipient,
        "status": status_str,
        "sent_via": sent_via,
        "created_at": now_iso,
        "html": html_content
    }
    await db.digests.insert_one(digest_doc)

    return {
        "message": "Weekly digest successfully processed." if status_str == "sent" else "Resend API key missing or offline: digest logged in database and marked status: queued.",
        "status": status_str,
        "sent_via": sent_via,
        "recipient": recipient
    }

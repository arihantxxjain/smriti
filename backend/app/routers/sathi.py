import re
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db
from app.auth import get_current_user
from app.config import settings
from app.schemas import SathiChatRequest
from bson import ObjectId

router = APIRouter(prefix="/sathi", tags=["sathi"])

DISTRESS_PATTERNS = [
    r"where am i", r"who are you", r"lost", r"scared", r"fear", r"help me", r"die",
    r"want to go home", r"take me home", r"don't know", r"confused", r"stolen",
    r"ক'ত আছো", r"মই ক'ত", r"কোন তুমি", r"ডৰ লাগিছে", r"ভয় লাগিছে", r"পাহৰি গ'লো", r"ঘৰলৈ যাম",
    r"कहाँ हूँ", r"डर लग रहा", r"घर जाना", r"भूल गया", r"मदद करो", r"बचाओ"
]

FALLBACK_CALM_RESPONSES = {
    "as": (
        "মই আপোনাৰ লগত আছো। আপুনি আপোনাৰ নিজৰ ঘৰতে সুৰক্ষিত আছে। "
        "চিন্তা নকৰিব, আহক আমি অলপ জিৰণি লওঁ। আপুনি এতিয়া একাপ গৰম চাহ খাবনে?"
    ),
    "hi": (
        "मैं आपके साथ हूँ। आप अपने घर पर पूरी तरह सुरक्षित हैं। "
        "बिल्कुल चिंता न करें। चलिए थोड़ा विश्राम करते हैं। क्या आप एक कप गर्म चाय पिएंगे?"
    ),
    "en": (
        "I am right here with you. You are completely safe at home. "
        "Take a gentle breath. Let us relax and look at your family pictures together."
    )
}

def detect_distress(text: str) -> bool:
    clean = text.lower()
    for pattern in DISTRESS_PATTERNS:
        if re.search(pattern, clean, re.IGNORECASE):
            return True
    return False

def build_demo_reply(message: str, lang: str, patient_name: str, family_names: str, fav_food: str, fav_places: str) -> str:
    """No-key demo companion: predictable, private, and useful for SIH judging."""
    text = message.lower()
    if any(word in text for word in ("medicine", "medication", "tablet", "medicine", "দৰব", "ঔষধ", "दवा")):
        replies = {
            "as": "আপোনাৰ আজিৰ ঔষধৰ সময়সূচী চাবলৈ ‘Today’s Reminders’ খোলক। সন্দেহ থাকিলে পৰিয়ালৰ সদস্যক সুধিব।",
            "hi": "आज की दवा का समय देखने के लिए ‘Today’s Reminders’ खोलें। कोई संदेह हो तो परिवार के सदस्य से पूछें।",
            "en": "Open Today’s Reminders to check your medicine schedule. If you are unsure, please ask a family member."
        }
        return replies.get(lang, replies["en"])
    if any(word in text for word in ("family", "son", "daughter", "photo", "পরিয়াল", "ছবি", "परिवार", "फोटो")):
        replies = {
            "as": f"{patient_name} ডাঙৰীয়া, আপোনাৰ পৰিয়াল {family_names} আপোনাক বহুত মৰম কৰে। Memory Aids খুলি তেওঁলোকৰ ছবিবোৰ চাওঁ আহক।",
            "hi": f"{patient_name} जी, आपका परिवार {family_names} आपको बहुत प्यार करता है। आइए Memory Aids में उनकी तस्वीरें देखें।",
            "en": f"{patient_name}, your family {family_names} cares for you deeply. Let us open Memory Aids and look at their photos."
        }
        return replies.get(lang, replies["en"])
    if any(word in text for word in ("food", "tea", "hungry", "চাহ", "খাব", "चाय", "खाना")):
        replies = {
            "as": f"এটা ভাল কথা। আপোনাৰ পছন্দৰ {fav_food} মনত আছে। সম্ভৱ হ’লে পৰিয়ালৰ কাকো একেলগে জলপান খাবলৈ কওক।",
            "hi": f"यह अच्छी बात है। आपको {fav_food} पसंद है। संभव हो तो परिवार के किसी सदस्य के साथ कुछ खाइए।",
            "en": f"That sounds nice. You enjoy {fav_food}. If possible, ask a family member to share a snack or tea with you."
        }
        return replies.get(lang, replies["en"])
    replies = {
        "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া। মই আপোনাৰ কথা শুনি আছো। আজি {fav_places}ৰ এটা মৰমলগা স্মৃতি মনত পৰে নেকি?",
        "hi": f"नमस्ते {patient_name} जी। मैं आपकी बात सुन रहा हूँ। क्या आज आपको {fav_places} की कोई प्यारी याद आ रही है?",
        "en": f"Namaskar {patient_name}. I am listening. Does a happy memory of {fav_places} come to mind today?"
    }
    return replies.get(lang, replies["en"])

@router.post("/chat")
async def chat_with_sathi(payload: SathiChatRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient_id = payload.patient_id
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_name = patient.get("name", "Elder")
    lang = payload.language or patient.get("language", "as")

    # Fetch personalization context from survey and facts
    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    facts_cursor = db.facts.find({"patient_id": patient_id}).limit(5)
    facts_list = [f.get("content") async for f in facts_cursor]

    family_members = survey.get("family_context", []) if survey else []
    family_names = ", ".join([f"{m.get('name')} ({m.get('relationship')})" for m in family_members]) if family_members else "family members"
    interests = survey.get("interests_history", {}) if survey else {}
    fav_food = ", ".join(interests.get("favorite_foods", [])) or "Assam tea"
    fav_places = ", ".join(interests.get("favorite_places", [])) or "Jorhat"

    # Guardrail check for acute distress or disorientation
    is_distressed = detect_distress(payload.message)
    if is_distressed:
        now_iso = datetime.now(timezone.utc).isoformat()
        # Log flagged alert for caregiver immediately
        alert_doc = {
            "patient_id": patient_id,
            "type": "decline",
            "severity": "high",
            "read": False,
            "dismissed": False,
            "timestamp": now_iso,
            "resolved_by": None,
            "details": {
                "reason": "Sathi guardrail detected acute distress or confusion in patient conversation",
                "patient_utterance": payload.message,
                "action_taken": "Flagged alert created; soothing response presented",
                "simulated_sms": f"CAREGIVER NOTICE: Patient {patient_name} voiced confusion/distress in Sathi companion: '{payload.message[:50]}...'. Please offer reassurance."
            }
        }
        await db.alerts.insert_one(alert_doc)

    # If distress detected, return high-priority reassuring response
    if is_distressed:
        reassurance = {
            "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া। আপুনি আপোনাৰ চিনাকি ঘৰতে সুৰক্ষিত আছে। আপোনাৰ পৰিয়াল {family_names} আপোনাৰ কাষতেই আছে। একো চিন্তা নকৰিব, আহক অলপ বহক।",
            "hi": f"नमस्ते {patient_name} जी। आप बिल्कुल सुरक्षित हैं। आपका परिवार {family_names} आपके साथ है। चिंता मत कीजिए, शांत रहिए।",
            "en": f"Namaskar {patient_name}. You are completely safe in your home in {fav_places}. Your family {family_names} is close by. Take a gentle breath, you are safe."
        }
        reply_text = reassurance.get(lang, reassurance["en"])
        return {
            "reply": reply_text,
            "distress_flagged": True,
            "language": lang
        }

    # Attempt LLM call if OpenAI key exists
    system_prompt = (
        f"You are Sathi (সাথী), an empathetic, polite, voice-first AI companion for {patient_name}, "
        f"an elderly person in North East India with mild cognitive impairment. "
        f"Family context: {family_names}. "
        f"Favorite places: {fav_places}. Favorite foods: {fav_food}. "
        f"Facts about their life: {'; '.join(facts_list)}. "
        f"Respond in {lang} language (or English if requested), with extreme gentleness, warmth, short sentences (1-2 sentences maximum), "
        f"using positive grounding memories. NEVER show technical or medical jargon."
    )

    if settings.OPENAI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": payload.message}
                        ],
                        "max_tokens": 80,
                        "temperature": 0.6
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    bot_text = data["choices"][0]["message"]["content"].strip()
                    return {"reply": bot_text, "distress_flagged": False, "language": lang}
        except Exception:
            # Fall through silently to calm fallback on timeout or error
            pass

    reply = build_demo_reply(payload.message, lang, patient_name, family_names, fav_food, fav_places)

    return {
        "reply": reply,
        "distress_flagged": False,
        "language": lang
    }

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
    r"ক'ত আছো", r"মই ক'ত", r"কোন তুমি", r"ডৰ লাগিছে", r"ভয় লাগিছে", r"পাহৰি গ'লো", r"ঘৰলৈ যাম",
    r"कहाँ हूँ", r"डर लग रहा", r"घर जाना", r"भूल गया", r"मदद करो", r"बचाओ"
]

FALLBACK_CALM_RESPONSES = {
    "as": (
        "মই আপোনাৰ লগত আছো। আপুনি আপোনাৰ নিজৰ ঘৰতে সুৰক্ষিত আছে। "
        "চিন্তা নকৰিব, আহক আমি অলপ জিৰণি লওঁ। আপুনি এতিয়া একাপ গৰম চাহ খাবনে?"
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
    """Rich, empathetic offline intent matcher for SIH evaluation and no-key scenarios."""
    text = message.lower().strip()

    # 1. Greetings & Well-being
    if any(w in text for w in ("hello", "hi", "namaskar", "kene asa", "kene ase", "how are you", "kaise ho", "নমস্কাৰ", "কেমন", "नमस्ते", "हाल")):
        replies = {
            "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া! মই ভালে আছো। আপুনি আজি কেনে অনুভৱ কৰিছে? আপোনাৰ দিনটো আনন্দময় হওক।",
            "hi": f"नमस्ते {patient_name} जी! मैं बिल्कुल ठीक हूँ। आज आपकी तबियत कैसी है? आशा है आपका दिन मंगलमय हो।",
            "en": f"Namaskar {patient_name}! I am doing very well, thank you. How are you feeling today?"
        }
        return replies.get(lang, replies["en"])

    # 2. Time & Date
    if any(w in text for w in ("time", "date", "clock", "today", "somoy", "baje", "দিন", "সময়", "বাজে", "समय", "तारीख")):
        replies = {
            "as": "বৰ্তমান সময় আৰু তাৰিখ চাবলৈ স্ক্ৰীণৰ ওপৰত বাওঁফালে থকা ঘড়ীটো চাওক।",
            "hi": "वर्तमान समय और तारीख देखने के लिए स्क्रीन के ऊपर बाईं ओर घड़ी देखें।",
            "en": "You can check the current time and date in IST on the top-left corner of your screen."
        }
        return replies.get(lang, replies["en"])

    # 3. Medicine & Health
    if any(w in text for w in ("medicine", "medication", "tablet", "pill", "doctor", "দৰব", "ঔষধ", "দবা", "दवा", "गोली", "डॉक्टर")):
        replies = {
            "as": f"আপোনাৰ আজিৰ ঔষধৰ তালিকা চাবলৈ ‘Today’s Reminders’ চাওক। কোনো অসুবিধা পালে {family_names}ক কওক।",
            "hi": f"अपनी आज की दवाइयाँ देखने के लिए ‘Today’s Reminders’ खोलें। कोई समस्या हो तो {family_names} को बताएं।",
            "en": f"Please check 'Today's Reminders' for your scheduled medications. If you have any doubt, let {family_names} know."
        }
        return replies.get(lang, replies["en"])

    # 4. Family & Photos
    if any(w in text for w in ("family", "son", "daughter", "children", "photo", "wife", "husband", "পৰিয়াল", "ল’ৰা", "ছোৱালী", "ছবি", "परिवार", "बेटा", "बेटी", "तस्वीर")):
        replies = {
            "as": f"{patient_name} ডাঙৰীয়া, আপোনাৰ মৰমৰ পৰিয়াল {family_names} সদায় আপোনাৰ লগত আছে। Memory Aids ত গৈ তেওঁলোকৰ পুৰণি ফটো চাওঁ আহক।",
            "hi": f"{patient_name} जी, आपका प्यारा परिवार {family_names} हमेशा आपके साथ है। Memory Aids में चलकर उनकी पुरानी तस्वीरें देखते हैं।",
            "en": f"{patient_name}, your loving family ({family_names}) cares for you deeply. Let us look at your family photos in Memory Aids."
        }
        return replies.get(lang, replies["en"])

    # 5. Food & Tea
    if any(w in text for w in ("food", "tea", "chai", "lunch", "dinner", "breakfast", "hungry", "চাহ", "ভাত", "খোৱা", "জলপান", "चाय", "खाना", "भूख")):
        replies = {
            "as": f"আপুনি {fav_food} ভাল পায় বুলি মনত আছে। আহক এতিয়া একাপ গৰম অসম চাহ খাওঁ।",
            "hi": f"मुझे याद है आपको {fav_food} बहुत पसंद है। चलिए एक कप ताज़ा चाय पीते हैं।",
            "en": f"I remember you love {fav_food}! How about having a refreshing cup of tea now?"
        }
        return replies.get(lang, replies["en"])

    # 6. Games & Activities / Boredom
    if any(w in text for w in ("game", "play", "exercise", "bored", "খেল", "ব্যায়াম", "মন ভাল নাই", "खेल", "बोर")):
        replies = {
            "as": "আহক আমি স্মৃতি মিলোৱা খেল (Memory Match) বা চিনাকি বস্তুৰ খেল খেলি অলপ আনন্দ লওঁ!",
            "hi": "चलिए थोड़ा मनोरंजन करते हैं! आप Memory Match या सांस्कृतिक वस्तु पहचान खेल खेल सकते हैं।",
            "en": "Let's refresh your mind! You can play Memory Match or the Cultural Recognition game."
        }
        return replies.get(lang, replies["en"])

    # 7. Stories & Memories of North East
    if any(w in text for w in ("story", "kahini", "sadhu", "past", "childhood", "কাহিনী", "সাধু", "পুৰণি", "कहानी", "याद")):
        replies = {
            "as": f"{fav_places}ৰ সুন্দৰ স্মৃতি আৰু আমাৰ বৰলুইতৰ পাৰৰ দিনবোৰৰ কথা মনত পৰিলে মনটো আনন্দৰে ভৰি পৰে।",
            "hi": f"{fav_places} की खूबसूरत यादें और पुराने दिन वाकई बहुत यादगार हैं।",
            "en": f"Fond memories of {fav_places} and the peaceful days always bring warmth to the heart."
        }
        return replies.get(lang, replies["en"])

    # Default gentle, acknowledging response
    replies = {
        "as": f"মই বুজি পাইছো {patient_name} ডাঙৰীয়া। মই সদায় আপোনাৰ কথা শুনিবলৈ সাজু। মোক আপোনাৰ পৰিয়াল, কাম বা পছন্দৰ বস্তুৰ বিষয়ে কওক।",
        "hi": f"मैं समझ रहा हूँ {patient_name} जी। मैं आपकी बात सुनने के लिए हमेशा यहाँ हूँ। आप मुझसे अपने परिवार, काम या अपनी पसंद के बारे में कुछ भी पूछ सकते हैं।",
        "en": f"I hear you, {patient_name}. I am always here to listen and assist you. Feel free to ask about your family, reminders, or stories."
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
            "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া। আপুনি আপোনাৰ চিনাকি ঘৰতে সুৰক্ষিত আছে। আপোনাৰ পৰিয়াল {family_names} আপোনাৰ কাষতেই আছে। একো চিন্তা নকৰিব, আহক অলপ বহক।",
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

    # 1. Attempt Free Groq API first (Llama 3.3 70B / 3.1 8B - ultra fast & free)
    api_key = settings.GROQ_API_KEY or settings.OPENAI_API_KEY
    api_url = "https://api.groq.com/openai/v1/chat/completions" if settings.GROQ_API_KEY else "https://api.openai.com/v1/chat/completions"
    model_name = "groq/compound-mini" if settings.GROQ_API_KEY else "gpt-4o-mini"

    if api_key:
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                res = await client.post(
                    api_url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model_name,
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
            pass  # Fall through to rich demo replies on timeout or network issue

    # 2. Rich Offline Question Set (zero API key fallback)
    reply = build_demo_reply(payload.message, lang, patient_name, family_names, fav_food, fav_places)

    return {
        "reply": reply,
        "distress_flagged": False,
        "language": lang
    }

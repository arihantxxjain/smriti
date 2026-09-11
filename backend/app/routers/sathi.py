import re
import random
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

def detect_distress(text: str) -> bool:
    clean = text.lower()
    for pattern in DISTRESS_PATTERNS:
        if re.search(pattern, clean, re.IGNORECASE):
            return True
    return False

async def call_external_llm(system_prompt: str, user_message: str) -> str:
    """Attempts calling configured LLMs (Gemini, Groq, OpenAI) with 4s timeout."""
    # 1. Google Gemini API (if key present)
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": user_message}]}],
                "generationConfig": {"temperature": 0.6, "maxOutputTokens": 100}
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return text.strip()
        except Exception as e:
            print(f"[Sathi] Gemini error: {e}")

    # 2. Groq Free Tier (if key present)
    if settings.GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 100,
                "temperature": 0.6
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["choices"][0]["message"]["content"].strip()
                    if text:
                        return text
        except Exception as e:
            print(f"[Sathi] Groq error: {e}")

    # 3. OpenAI (if key present)
    if settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "max_tokens": 100,
                "temperature": 0.6
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["choices"][0]["message"]["content"].strip()
                    if text:
                        return text
        except Exception as e:
            print(f"[Sathi] OpenAI error: {e}")

    return None

@router.post("/chat")
async def chat_with_sathi(payload: SathiChatRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient_id = payload.patient_id
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_name = patient.get("name", "Elder")
    lang = payload.language or patient.get("language", "as")
    user_msg_clean = payload.message.strip()

    # 1. Fetch live personalization context from MongoDB
    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    facts_cursor = db.facts.find({"patient_id": patient_id}).limit(5)
    facts_list = [f.get("content") async for f in facts_cursor]

    family_members = survey.get("family_context", []) if survey else []
    family_names = ", ".join([f"{m.get('name')} ({m.get('relationship')})" for m in family_members]) if family_members else "Bikash Baruah (Son)"
    interests = survey.get("interests_history", {}) if survey else {}
    fav_food = ", ".join(interests.get("favorite_foods", [])) or "Assam tea"
    fav_places = ", ".join(interests.get("favorite_places", [])) or "Jorhat"

    # Fetch today's reminders
    reminders_cursor = db.reminders.find({"patient_id": patient_id, "active": True}).sort("time_str", 1)
    reminders_list = [r async for r in reminders_cursor]
    now_iso_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    pending_meds = [r["title"] for r in reminders_list if now_iso_date not in r.get("completed_dates", [])]

    # 2. Guardrail check for acute distress, fear or disorientation
    is_distressed = detect_distress(user_msg_clean)
    if is_distressed:
        now_iso = datetime.now(timezone.utc).isoformat()
        alert_doc = {
            "patient_id": patient_id,
            "type": "decline",
            "severity": "high",
            "read": False,
            "dismissed": False,
            "timestamp": now_iso,
            "resolved_by": None,
            "details": {
                "reason": "Sathi guardrail detected acute distress or confusion in patient voice conversation",
                "patient_utterance": user_msg_clean,
                "action_taken": "Flagged alert created; soothing response presented",
                "simulated_sms": f"CAREGIVER NOTICE: Patient {patient_name} voiced confusion/distress in Sathi companion: '{user_msg_clean[:50]}...'. Please offer reassurance."
            }
        }
        await db.alerts.insert_one(alert_doc)

        reassurance = {
            "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া। আপুনি আপোনাৰ চিনাকি ঘৰতে সুৰক্ষিত আছে। আপোনাৰ পৰিয়াল {family_names} আপোনাৰ কাষতেই আছে। একো চিন্তা নকৰিব, আহক অলপ শান্ত হৈ বহক।",
            "hi": f"नमस्ते {patient_name} जी। आप अपने घर पर बिल्कुल सुरक्षित हैं। आपका परिवार {family_names} आपके साथ है। चिंता मत कीजिए, सब ठीक है।",
            "en": f"Namaskar {patient_name}. You are completely safe in your home in {fav_places}. Your family {family_names} is right with you. Take a gentle breath, you are safe."
        }
        return {
            "reply": reassurance.get(lang, reassurance["en"]),
            "distress_flagged": True,
            "language": lang
        }

    # 3. Intelligent Domain Intent Matching using live patient context
    lower_msg = user_msg_clean.lower()

    # Intent A: Medication & Reminders
    if any(k in lower_msg for k in ["medicine", "tablet", "ঔষধ", "দৱাই", "remind", "সময়সূচী", "আজ কি", "routine", "schedule"]):
        if pending_meds:
            first_med = pending_meds[0]
            reply = {
                "as": f"নমস্কাৰ {patient_name} ডাঙৰীয়া, আজি আপোনাৰ বাকী থকা ঔষধ হ'ল: {first_med}। পানীৰ সৈতে নিয়মমতে লৈ লওক।",
                "hi": f"नमस्ते {patient_name} जी, आज आपकी निर्धारित दवाई है: {first_med}। कृपया समय पर ले लें।",
                "en": f"Namaskar {patient_name}, your scheduled medication today is: {first_med}. Please take it with water."
            }
        else:
            reply = {
                "as": f"বৰ সুখৰ কথা {patient_name} ডাঙৰীয়া! আজিৰ সকলো সময়সূচী আৰু ঔষধ ইতিমধ্যে সম্পন্ন হৈছে।",
                "hi": f"बहुत अच्छी बात है {patient_name} जी! आज की सभी दवाइयाँ और कार्य पूरे हो चुके हैं।",
                "en": f"Wonderful news {patient_name}! All your scheduled reminders and medications for today are completed."
            }
        return {"reply": reply.get(lang, reply["en"]), "distress_flagged": False, "language": lang}

    # Intent B: Family & Loved Ones
    if any(k in lower_msg for k in ["family", "son", "daughter", "পৰিয়াল", "ল’ৰা", "বিকাশ", "ৰূপা", "প্ৰিয়ম", "child", "बच्चे"]):
        reply = {
            "as": f"আপোনাৰ মৰমৰ পৰিয়ালত আছে {family_names}। আপোনাৰ পুত্ৰ বিকাশ বৰুৱাই সদায় সন্ধিয়া আপোনাৰ খবৰ লয় আৰু সকলোৱে আপোনাক বৰ মৰম কৰে।",
            "hi": f"आपके परिवार में {family_names} हैं। आपके बेटे बिकाश बरुआ हमेशा आपकी देखभाल करते हैं और सभी आपसे बहुत प्यार करते हैं।",
            "en": f"Your loving family includes {family_names}. Your son Bikash calls regularly, and they all cherish you deeply."
        }
        return {"reply": reply.get(lang, reply["en"]), "distress_flagged": False, "language": lang}

    # Intent C: Career, Background & Life Facts
    if any(k in lower_msg for k in ["headmaster", "school", "স্কুল", "শিক্ষক", "কাম", "career", "teach", "পঢ়ুৱাইছিলোঁ", "চাকৰি"]):
        first_fact = facts_list[0] if facts_list else "আপুনি ৩২ বছৰ যোৰহাট চৰকাৰী হাইস্কুলত গণিতৰ প্ৰধান শিক্ষক আছিল।"
        reply = {
            "as": f"হয় {patient_name} ডাঙৰীয়া, আপুনি এগৰাকী অতি সন্মানীয় শিক্ষক আছিল। {first_fact}",
            "hi": f"हाँ {patient_name} जी, आप एक अत्यंत सम्मानित शिक्षक रहे हैं। आपने विद्यार्थियों का जीवन संवारा है।",
            "en": f"Yes {patient_name}, you served as an esteemed Headmaster of Mathematics for 32 years, deeply respected by everyone."
        }
        return {"reply": reply.get(lang, reply["en"]), "distress_flagged": False, "language": lang}

    # Intent D: Games & Cognitive Activities
    if any(k in lower_msg for k in ["game", "play", "খেল", "ব’ৰ", "মন বেয়া", "bore", "entertainment"]):
        reply = {
            "as": f"আহক আমি একেলগে আমাৰ স্মৃতি মিলোৱা খেল (Memory Match) বা চিনাকি বস্তুৰ খেল খেলো। আপুনি খেলি বৰ আনন্দ পাব!",
            "hi": f"चलिए हम मिलकर स्मृति मिलान (Memory Match) या सांस्कृतिक पहचान का खेल खेलते हैं। आपको बहुत अच्छा लगेगा!",
            "en": f"Let us play our Memory Match game or Cultural Recognition quiz together. It is gentle and fun for your mind!"
        }
        return {"reply": reply.get(lang, reply["en"]), "distress_flagged": False, "language": lang}

    # 4. If external LLM API configured, query with full dementia care system prompt
    system_prompt = (
        f"You are Sathi (সাথী), a loving, voice-first AI companion for {patient_name}, "
        f"an elderly person in North East India with mild cognitive impairment. "
        f"Family: {family_names}. Home: {fav_places}. Favorite food: {fav_food}. "
        f"Facts: {'; '.join(facts_list)}. Today's pending medicines: {', '.join(pending_meds) if pending_meds else 'All taken'}. "
        f"Respond in {lang} language (or English if requested), with extreme gentleness, warmth, short length (1-2 sentences maximum), "
        f"and positive grounding memories. NEVER use medical jargon or ask complex questions."
    )

    external_llm_reply = await call_external_llm(system_prompt, user_msg_clean)
    if external_llm_reply:
        return {"reply": external_llm_reply, "distress_flagged": False, "language": lang}

    # 5. Compassionate grounded fallback responses
    grounded_replies = {
        "as": [
            f"নমস্কাৰ {patient_name} ডাঙৰীয়া। আজি বতৰটো শান্ত হৈ আছে। আপুনি এতিয়া একাপ সুবাসিত গৰম অসম চাহ খাবনে?",
            f"আপোনাৰ কথা শুনি বৰ আনন্দ লাগিল। আপোনাৰ পুত্ৰ বিকাশ আৰু পৰিয়ালৰ সকলোৱে আপোনাক বৰ শ্ৰদ্ধা কৰে।",
            f"মই আপোনাৰ লগত সদায় আছো। মনটো শান্ত ৰাখক, সকলো ঠিকেই আছে।"
        ],
        "hi": [
            f"नमस्ते {patient_name} जी। आज का दिन बहुत सुखद है। क्या आप एक कप गर्म असम चाय लेना पसंद करेंगे?",
            f"आपकी आवाज सुनकर बहुत अच्छा लगा। आपका परिवार आपसे बहुत स्नेह करता है।",
            f"मैं हमेशा आपके साथ हूँ। बिल्कुल चिंता न करें, सब कुशल-मंगल है।"
        ],
        "en": [
            f"Namaskar {patient_name}. It is a calm and peaceful day. Would you enjoy a warm cup of Assam tea?",
            f"It is wonderful talking with you. Your family {family_names} loves you very dearly.",
            f"I am right here with you. Take a gentle breath, you are safe and cherished."
        ]
    }
    options = grounded_replies.get(lang, grounded_replies["en"])
    chosen_reply = random.choice(options)

    return {
        "reply": chosen_reply,
        "distress_flagged": False,
        "language": lang
    }

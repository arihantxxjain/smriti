from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db, serialize_doc
from app.auth import get_current_user
from app.schemas import GameSubmitSchema
from bson import ObjectId

router = APIRouter(prefix="/games", tags=["games"])

# Authentic NER Cultural Objects database for Recognition & Memory Match
NER_OBJECTS = [
    {
        "id": "gamosa",
        "name": "Gamusa (গামোচা)",
        "english": "Gamosa / Traditional Assamese Woven Towel",
        "category": "textile",
        "description": "White rectangular cotton cloth with red woven floral and geometric motifs, given as a mark of respect.",
        "icon": "Shirt",
        "hints": ["Red and white woven textile", "Worn around the neck in Bihu", "Symbol of Assamese pride"]
    },
    {
        "id": "assam_tea",
        "name": "Chah (অসম চাহ)",
        "english": "Assam Tea & Cup",
        "category": "beverage",
        "description": "Rich, malty black tea grown in the fertile valleys along the Brahmaputra River.",
        "icon": "Coffee",
        "hints": ["Famous warm beverage", "Grown in Upper Assam gardens", "Served with milk and jaggery"]
    },
    {
        "id": "jackfruit",
        "name": "Kothal (কঁঠাল)",
        "english": "Jackfruit",
        "category": "fruit",
        "description": "Large spiky green tropical fruit with sweet golden pods, state fruit of Assam.",
        "icon": "Apple",
        "hints": ["Large spiky green fruit", "Sweet sticky golden bulbs inside", "Summer favorite"]
    },
    {
        "id": "bamboo_house",
        "name": "Chang Ghar (চাং ঘৰ)",
        "english": "Traditional Bamboo Stilt House",
        "category": "architecture",
        "description": "Traditional North Eastern bamboo stilt house built above flood water level by Mising and other communities.",
        "icon": "Home",
        "hints": ["Built on bamboo stilts", "Keeps safe from floodwaters", "Traditional NER architecture"]
    },
    {
        "id": "hornbill",
        "name": "Dhanesh (ধনেশ / Hornbill)",
        "english": "Great Indian Hornbill",
        "category": "wildlife",
        "description": "Iconic majestic forest bird with a large yellow casque bill, deeply revered across Nagaland and Arunachal.",
        "icon": "Feather",
        "hints": ["Majestic forest bird", "Large yellow curved beak", "Celebrated in Nagaland festival"]
    },
    {
        "id": "bihu_dhol",
        "name": "Dhol (ঢোল)",
        "english": "Bihu Dhol / Folk Drum",
        "category": "instrument",
        "description": "Two-sided barrel drum made of hollowed wood and animal hide, heartbeat of the Rongali Bihu festival.",
        "icon": "Music",
        "hints": ["Two-sided rhythmic drum", "Played with a bamboo stick in Bihu", "Energetic festival sound"]
    },
    {
        "id": "jaapi",
        "name": "Jaapi (জাপি)",
        "english": "Traditional Conical Bamboo Hat",
        "category": "craft",
        "description": "Conical sunshade hat woven from tightly woven bamboo, cane, and large tokou leaves.",
        "icon": "Crown",
        "hints": ["Conical bamboo and leaf hat", "Protects farmers from rain and sun", "Placed on walls as honor"]
    }
]

@router.get("/config/{patient_id}/{game_type}")
async def get_game_config(patient_id: str, game_type: str, difficulty: str = "medium", current_user: dict = Depends(get_current_user)):
    db = get_db()
    survey = await db.patient_surveys.find_one({"patient_id": patient_id})
    routine = survey.get("daily_routine", {}) if survey else {}
    interests = survey.get("interests_history", {}) if survey else {}

    if game_type == "recognition":
        items = list(NER_OBJECTS)
        return {
            "game_type": game_type,
            "difficulty": difficulty,
            "objects": items,
            "instructions": "Look at the object and choose the correct name."
        }

    elif game_type == "daily_routine":
        wake = routine.get("wake_time", "06:30")
        sleep = routine.get("sleep_time", "21:30")
        meals = routine.get("meal_times", ["08:00", "13:00", "20:00"])
        meds = routine.get("medication_schedule", ["08:30 Morning Meds", "20:30 Night Meds"])

        steps = [
            {"id": "step_wake", "label": f"Wake up & stretch ({wake})", "order": 1, "icon": "Sun"},
            {"id": "step_tea", "label": "Drink warm morning Assam tea", "order": 2, "icon": "Coffee"},
            {"id": "step_med_m", "label": f"Take morning medicines ({meds[0] if meds else '08:30'})", "order": 3, "icon": "Pill"},
            {"id": "step_lunch", "label": f"Eat midday lunch ({meals[1] if len(meals) > 1 else '13:00'})", "order": 4, "icon": "Utensils"},
            {"id": "step_walk", "label": "Evening courtyard stroll", "order": 5, "icon": "Footprints"},
            {"id": "step_sleep", "label": f"Bedtime rest & sleep ({sleep})", "order": 6, "icon": "Moon"}
        ]
        if difficulty == "easy":
            steps = steps[:4]
            for idx, s in enumerate(steps):
                s["order"] = idx + 1
        return {
            "game_type": game_type,
            "difficulty": difficulty,
            "steps": steps,
            "instructions": "Arrange your daily routine activities in order from morning to night."
        }

    elif game_type == "memory_match":
        count = 4 if difficulty == "easy" else (6 if difficulty == "medium" else 8)
        cards = []
        for obj in NER_OBJECTS[:count]:
            cards.append({"id": f"{obj['id']}_1", "pair_id": obj["id"], "name": obj["name"], "icon": obj["icon"]})
            cards.append({"id": f"{obj['id']}_2", "pair_id": obj["id"], "name": obj["name"], "icon": obj["icon"]})
        return {
            "game_type": game_type,
            "difficulty": difficulty,
            "cards": cards,
            "instructions": "Tap cards to flip them and find the matching pairs."
        }

    elif game_type == "attention_spot_difference":
        rounds = [
            {
                "id": "round_1",
                "prompt": "Which item does NOT belong to traditional Assamese textiles?",
                "options": [
                    {"id": "gamusa", "text": "Gamusa (গামোচা)", "correct": False},
                    {"id": "chador", "text": "Muga Silk Mekhela", "correct": False},
                    {"id": "plastic_bag", "text": "Plastic Shopping Bag", "correct": True},
                    {"id": "eri_shawl", "text": "Eri Warm Shawl", "correct": False}
                ],
                "explanation": "Plastic shopping bag is not a traditional Assamese textile."
            },
            {
                "id": "round_2",
                "prompt": "Which time is typical for drinking morning tea?",
                "options": [
                    {"id": "0700", "text": "07:00 AM (Morning)", "correct": True},
                    {"id": "2330", "text": "11:30 PM (Midnight)", "correct": False},
                    {"id": "0200", "text": "02:00 AM (Deep night)", "correct": False}
                ],
                "explanation": "Morning tea is traditionally taken early in the morning."
            },
            {
                "id": "round_3",
                "prompt": "Find the fruit native to North East India orchards:",
                "options": [
                    {"id": "kothal", "text": "Kothal / Jackfruit (কঁঠাল)", "correct": True},
                    {"id": "ice_cube", "text": "Ice Cube", "correct": False},
                    {"id": "dry_leaf", "text": "Dry Bark", "correct": False}
                ],
                "explanation": "Kothal (Jackfruit) is a beloved sweet orchard fruit."
            }
        ]
        return {
            "game_type": game_type,
            "difficulty": difficulty,
            "rounds": rounds,
            "instructions": "Spot the odd item or choose the correct answer in each round."
        }

    return {"message": "Game configuration generated"}

@router.post("/submit")
async def submit_game_session(payload: GameSubmitSchema, current_user: dict = Depends(get_current_user)):
    db = get_db()
    patient_id = payload.patient_id
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    session_doc = {
        "patient_id": patient_id,
        "game_type": payload.game_type,
        "difficulty": payload.difficulty,
        "responses": [r.model_dump() for r in payload.responses],
        "accuracy": round(payload.accuracy, 1),
        "completion": round(payload.completion, 1),
        "composite_score": round(payload.composite_score, 1),
        "timestamp": now_iso
    }
    result = await db.game_sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)

    # Rolling 7-day average decline calculation
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    fourteen_days_ago = (now - timedelta(days=14)).isoformat()

    recent_cursor = db.game_sessions.find({
        "patient_id": patient_id,
        "timestamp": {"$gte": seven_days_ago, "$lte": now_iso}
    })
    recent_scores = [s.get("composite_score", 0) async for s in recent_cursor]

    prior_cursor = db.game_sessions.find({
        "patient_id": patient_id,
        "timestamp": {"$gte": fourteen_days_ago, "$lt": seven_days_ago}
    })
    prior_scores = [s.get("composite_score", 0) async for s in prior_cursor]

    decline_alert_created = False
    score_drop = 0.0

    if len(recent_scores) >= 1 and len(prior_scores) >= 1:
        avg_recent = sum(recent_scores) / len(recent_scores)
        avg_prior = sum(prior_scores) / len(prior_scores)
        score_drop = avg_prior - avg_recent

        if score_drop > 15.0:
            patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
            survey = await db.patient_surveys.find_one({"patient_id": patient_id})
            emergency_phone = survey.get("safety", {}).get("emergency_contact_phone", "Caregiver") if survey else "Caregiver"
            
            alert_doc = {
                "patient_id": patient_id,
                "type": "decline",
                "severity": "high" if score_drop <= 25.0 else "critical",
                "read": False,
                "dismissed": False,
                "timestamp": now_iso,
                "resolved_by": None,
                "details": {
                    "reason": f"Cognitive score drop of {round(score_drop, 1)} points detected (>15 threshold)",
                    "prior_7d_avg": round(avg_prior, 1),
                    "recent_7d_avg": round(avg_recent, 1),
                    "score_drop": round(score_drop, 1),
                    "trigger_game": payload.game_type,
                    "simulated_sms": f"ALERT: Significant cognitive score decline ({round(score_drop, 1)} pts) detected for patient {patient.get('name', '')}. Please review daily activities.",
                    "simulated_sms_sent_to": emergency_phone
                }
            }
            await db.alerts.insert_one(alert_doc)
            decline_alert_created = True

    return {
        "session_id": session_id,
        "composite_score": payload.composite_score,
        "decline_alert_created": decline_alert_created,
        "score_drop": round(score_drop, 1)
    }

@router.get("/sessions/{patient_id}")
async def get_patient_game_sessions(patient_id: str, limit: int = 150, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.game_sessions.find({"patient_id": patient_id}).sort("timestamp", 1).limit(limit)
    sessions = []
    async for s in cursor:
        sessions.append(serialize_doc(s))
    return sessions

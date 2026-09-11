import asyncio
import random
from datetime import datetime, timedelta, timezone
from app.database import init_db, get_db
from app.auth import hash_password, hash_pin
from bson import ObjectId

async def seed_database():
    await init_db()
    db = get_db()
    
    # 1. Demo Caregiver
    caregiver_email = "caregiver@smriti.in"
    existing_cg = await db.caregivers.find_one({"email": caregiver_email})
    if existing_cg:
        caregiver_id = existing_cg["_id"]
        cg_id_str = str(caregiver_id)
        print(f"[Seed] Existing caregiver found: {caregiver_email} (ID: {cg_id_str})")
    else:
        cg_doc = {
            "name": "Dr. Ananya Sarmah",
            "email": caregiver_email,
            "password_hash": hash_password("Smriti@2026"),
            "phone": "+91 94350 12345",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await db.caregivers.insert_one(cg_doc)
        caregiver_id = res.inserted_id
        cg_id_str = str(caregiver_id)
        print(f"[Seed] Created demo caregiver: {caregiver_email} (ID: {cg_id_str})")

    # 2. Demo Patient (Promod Baruah, code: DEMO01, PIN: 1234)
    patient_code = "DEMO01"
    existing_patient = await db.patients.find_one({"code": patient_code})
    
    now = datetime.now(timezone.utc)
    ten_weeks_ago = (now - timedelta(days=70)).isoformat()

    if existing_patient:
        patient_id = existing_patient["_id"]
        patient_id_str = str(patient_id)
        print(f"[Seed] Existing demo patient found: {patient_code} (ID: {patient_id_str})")
    else:
        patient_doc = {
            "name": "Promod Baruah",
            "dob": "1954-08-15",
            "dementia_stage": "mild",
            "language": "as",
            "code": patient_code,
            "pin_hash": hash_pin("1234"),
            "failed_login_attempts": 0,
            "lockout_until": None,
            "caregiver_id": caregiver_id,
            "geofence": {
                "center_lat": 26.7509,
                "center_lng": 94.2037,
                "radius_m": 500.0
            },
            "consent_flag": True,
            "consent_timestamp": ten_weeks_ago,
            "created_at": ten_weeks_ago
        }
        res = await db.patients.insert_one(patient_doc)
        patient_id = res.inserted_id
        patient_id_str = str(patient_id)
        print(f"[Seed] Created demo patient: {patient_code} (ID: {patient_id_str})")

    # 3. Patient Survey
    await db.patient_surveys.delete_many({"patient_id": patient_id_str})
    survey_doc = {
        "patient_id": patient_id_str,
        "basic": {
            "name": "Promod Baruah",
            "dob": "1954-08-15",
            "gender": "male",
            "native_language": "as",
            "years_of_education": 16
        },
        "cognitive_baseline": {
            "diagnosed_stage": "mild",
            "diagnosis_date": "2024-03-12",
            "triggers_confusion_patterns": "Occasional sundowning around dusk; forgets names of distant relatives; becomes anxious if morning tea is delayed."
        },
        "family_context": [
            {
                "name": "Bikash Baruah",
                "relationship": "Son",
                "notes": "Civil engineer based in Guwahati. Calls every evening at 7:30 PM.",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
            },
            {
                "name": "Rupa Baruah",
                "relationship": "Daughter-in-law",
                "notes": "Stays with him in Jorhat; coordinates medication and meals.",
                "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"
            },
            {
                "name": "Priyam Baruah",
                "relationship": "Granddaughter",
                "notes": "9-year-old school student; loves playing carrom and listening to his folk tales.",
                "photo_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80"
            },
            {
                "name": "Late Hemalata Baruah",
                "relationship": "Late Wife",
                "notes": "Married in 1978 in Majuli. Passed away peacefully in 2021.",
                "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
            }
        ],
        "daily_routine": {
            "wake_time": "06:15",
            "sleep_time": "21:30",
            "meal_times": ["07:45 (Breakfast)", "13:00 (Lunch)", "17:00 (Evening Tea)", "20:30 (Dinner)"],
            "medication_schedule": ["08:00 (Donepezil 5mg)", "13:30 (Multivitamin)", "21:00 (BP Tablet)"]
        },
        "interests_history": {
            "hobbies": ["Assam tea tasting", "Orchid gardening", "Reading Assamese literature", "Listening to Bihu folk songs"],
            "former_occupation": "Headmaster of Mathematics, Jorhat Govt Boys High School (32 years)",
            "favorite_places": ["Jorhat Tea Garden", "Kamalabari Satra Majuli", "Kaziranga National Park", "Brahmaputra Ghat"],
            "favorite_foods": ["Masor Tenga (tangy fish curry)", "Khar", "Rice Pitha", "Warm Assam CTC tea with ginger"]
        },
        "safety": {
            "wandering_risk": True,
            "mobility_level": "independent with walking cane",
            "emergency_contact_name": "Bikash Baruah (Son)",
            "emergency_contact_phone": "+91 98640 11223"
        },
        "updated_at": now.isoformat()
    }
    await db.patient_surveys.insert_one(survey_doc)
    print("[Seed] Seeded comprehensive PatientSurvey")

    # 4. Standalone Facts (Distinct from Memories)
    await db.facts.delete_many({"patient_id": patient_id_str})
    facts = [
        {"patient_id": patient_id_str, "category": "career", "content": "Served as Mathematics Headmaster at Jorhat Government High School for 32 years (1980–2012).", "created_at": ten_weeks_ago},
        {"patient_id": patient_id_str, "category": "hobby", "content": "Cultivates 14 varieties of indigenous orchids and Assam lemon in his Jorhat garden.", "created_at": ten_weeks_ago},
        {"patient_id": patient_id_str, "category": "achievement", "content": "Received the District Best Educator Honour Award on Teachers' Day in 2004.", "created_at": ten_weeks_ago},
        {"patient_id": patient_id_str, "category": "family", "content": "Met his beloved wife Hemalata at the Majuli Raas Mahotsav in November 1978.", "created_at": ten_weeks_ago},
        {"patient_id": patient_id_str, "category": "favorite", "content": "Takes two spoons of local golden clover honey with his morning Assam ginger tea.", "created_at": ten_weeks_ago}
    ]
    await db.facts.insert_many(facts)
    print(f"[Seed] Seeded {len(facts)} standalone Facts")

    # 5. Memories (Photos + Stories, distinct from facts)
    await db.memories.delete_many({"patient_id": patient_id_str})
    memories = [
        {
            "patient_id": patient_id_str,
            "title": "Majuli Satra Mask Crafting (2018)",
            "photo_url": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&auto=format&fit=crop&q=80",
            "caption": "Watching master artisans craft traditional bamboo and clay Mukha (masks) at Natun Samaguri Satra on Majuli island with granddaughter Priyam.",
            "person_event": "Priyam Baruah (Granddaughter)",
            "approx_year_or_date": "Winter 2018",
            "tts_text": "This is your trip to Majuli with granddaughter Priyam in 2018. You enjoyed watching the bamboo mask artists.",
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Kaziranga Elephant & Rhino Safari (2015)",
            "photo_url": "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=600&auto=format&fit=crop&q=80",
            "caption": "Early morning drive through the elephant grass at Kohora Range in Kaziranga. We spotted a mother rhino and calf near the water body.",
            "person_event": "Bikash & Rupa Baruah",
            "approx_year_or_date": "February 2015",
            "tts_text": "Here is the family morning safari in Kaziranga National Park where you spotted the one-horned rhino.",
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Headmaster Retirement Felicitation (2012)",
            "photo_url": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
            "caption": "Over 400 former students gathered at Jorhat Town Hall to honor Promod sir with traditional Eri Seleng and citations.",
            "person_event": "Jorhat High School Community",
            "approx_year_or_date": "August 2012",
            "tts_text": "Your grand retirement celebration at Jorhat Town Hall where your students presented you with an honored Eri Seleng.",
            "created_at": ten_weeks_ago
        }
    ]
    await db.memories.insert_many(memories)
    print(f"[Seed] Seeded {len(memories)} Memories")

    # 6. Reminders
    await db.reminders.delete_many({"patient_id": patient_id_str})
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    reminders = [
        {
            "patient_id": patient_id_str,
            "title": "Morning Donepezil (5mg) with water",
            "time_str": "08:00",
            "category": "medication",
            "completed_dates": [today_str, yesterday_str],
            "active": True,
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Breakfast with fresh papaya & warm Assam tea",
            "time_str": "08:30",
            "category": "meal",
            "completed_dates": [today_str, yesterday_str],
            "active": True,
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Drink full glass of water & hydration",
            "time_str": "11:00",
            "category": "hydration",
            "completed_dates": [today_str],
            "active": True,
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Lunch & Multivitamin capsule",
            "time_str": "13:00",
            "category": "medication",
            "completed_dates": [yesterday_str],
            "active": True,
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Evening Courtyard Walk with cane",
            "time_str": "16:45",
            "category": "activity",
            "completed_dates": [yesterday_str],
            "active": True,
            "created_at": ten_weeks_ago
        },
        {
            "patient_id": patient_id_str,
            "title": "Night BP Tablet & warm spiced milk",
            "time_str": "21:00",
            "category": "medication",
            "completed_dates": [yesterday_str],
            "active": True,
            "created_at": ten_weeks_ago
        }
    ]
    await db.reminders.insert_many(reminders)
    print(f"[Seed] Seeded {len(reminders)} daily Reminders")

    # 7. 10 Weeks of Historical GameSessions
    # Demonstrating a visible declining trend in "memory_match" over the last 14 days
    await db.game_sessions.delete_many({"patient_id": patient_id_str})
    game_sessions = []
    
    # 70 days, 1-2 sessions per day across the 4 game types
    game_types = ["memory_match", "attention_spot_difference", "daily_routine", "recognition"]

    for day_offset in range(70, 0, -2):
        session_time = now - timedelta(days=day_offset, hours=random.randint(1, 6))
        session_time_iso = session_time.isoformat()

        for g_type in game_types:
            # Baseline performance in weeks 1-8 (days 70 to 15 ago)
            if day_offset > 14:
                acc = random.uniform(84.0, 96.0)
                comp = 100.0
                score = round(acc * 0.7 + comp * 0.3 - random.uniform(0, 4), 1)
            else:
                # Weeks 9-10 (days 14 to 0 ago): visible decline in memory_match domain!
                if g_type == "memory_match":
                    acc = random.uniform(48.0, 62.0)  # >25 points drop!
                    comp = random.uniform(65.0, 80.0)
                    score = round(acc * 0.7 + comp * 0.3 - random.uniform(2, 6), 1)
                else:
                    # other games remain relatively stable with slight natural variation
                    acc = random.uniform(76.0, 88.0)
                    comp = random.uniform(90.0, 100.0)
                    score = round(acc * 0.7 + comp * 0.3 - random.uniform(0, 3), 1)

            game_sessions.append({
                "patient_id": patient_id_str,
                "game_type": g_type,
                "difficulty": "medium",
                "responses": [
                    {"item_id": f"item_{i}", "prompt": f"Round {i}", "chosen": "ans", "correct": random.random() > 0.2, "reaction_time_ms": random.randint(1200, 3500)}
                    for i in range(4)
                ],
                "accuracy": round(acc, 1),
                "completion": round(comp, 1),
                "composite_score": max(20.0, min(100.0, score)),
                "timestamp": session_time_iso
            })

    await db.game_sessions.insert_many(game_sessions)
    print(f"[Seed] Seeded {len(game_sessions)} GameSessions over 10 weeks showing clear decline in memory_match")

    # 8. Alerts (Decline Alert triggered by recent score drop + SOS alert demo)
    await db.alerts.delete_many({"patient_id": patient_id_str})
    decline_alert = {
        "patient_id": patient_id_str,
        "type": "decline",
        "severity": "high",
        "read": False,
        "dismissed": False,
        "timestamp": (now - timedelta(days=2)).isoformat(),
        "resolved_by": None,
        "details": {
            "reason": "Cognitive score drop of 21.4 points detected in Memory Match (>15 threshold)",
            "prior_7d_avg": 86.8,
            "recent_7d_avg": 65.4,
            "score_drop": 21.4,
            "trigger_game": "memory_match",
            "simulated_sms": "ALERT: Significant cognitive score decline (21.4 pts) detected for patient Promod Baruah. Please review daily memory activities with doctor.",
            "simulated_sms_sent_to": "+91 98640 11223"
        }
    }
    geofence_alert = {
        "patient_id": patient_id_str,
        "type": "geofence",
        "severity": "medium",
        "read": True,
        "dismissed": False,
        "timestamp": (now - timedelta(days=8)).isoformat(),
        "resolved_by": "Dr. Ananya Sarmah",
        "details": {
            "reason": "Patient reached boundary buffer (490m from center).",
            "lat": 26.7541,
            "lng": 94.2078,
            "distance_m": 490,
            "simulated_sms": "GEOFENCE NOTICE: Promod Baruah is near designated boundary (490m). Returned safely."
        }
    }
    await db.alerts.insert_many([decline_alert, geofence_alert])
    print("[Seed] Seeded simulated Alerts")

    print("\n==========================================")
    print("SMRITI SEED DATA SUMMARY:")
    print("Caregiver: caregiver@smriti.in / Smriti@2026")
    print(f"Patient Code: {patient_code} / PIN: 1234")
    print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(seed_database())

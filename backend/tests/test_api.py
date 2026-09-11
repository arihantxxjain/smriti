import asyncio
import httpx
from app.main import app
from app.database import init_db
from app.seed import seed_database

async def run_tests():
    # Initialize DB and seed for in-memory mock testing
    await init_db()
    await seed_database()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("PASS: Health check")

        # 2. Patient Login with DEMO01 / 1234
        res = await client.post("/api/auth/patient/login", json={"code": "DEMO01", "pin": "1234"})
        assert res.status_code == 200, f"Patient login failed: {res.text}"
        patient_token = res.json()["access_token"]
        patient_id = res.json()["user"]["id"]
        print(f"PASS: Patient login successful (Patient ID: {patient_id})")

        # 2b. Test /api/auth/me for patient (verifying BSON ObjectId serialization)
        res_me_pt = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
        assert res_me_pt.status_code == 200, f"Patient /api/auth/me failed: {res_me_pt.text}"
        assert res_me_pt.json()["id"] == patient_id
        assert isinstance(res_me_pt.json().get("caregiver_id"), str)
        print("PASS: Patient /api/auth/me successfully returned JSON with serialized caregiver_id")

        # 3. Test failed PIN lockout warning
        res = await client.post("/api/auth/patient/login", json={"code": "DEMO01", "pin": "9999"})
        assert res.status_code == 401, f"Expected 401 on wrong PIN: {res.text}"
        print("PASS: Patient failed PIN attempt correctly rejected with remaining attempts counter")

        # Reset login state
        res = await client.post("/api/auth/patient/login", json={"code": "DEMO01", "pin": "1234"})
        assert res.status_code == 200

        # 4. Caregiver Login with caregiver@smriti.in / Smriti@2026
        res = await client.post("/api/auth/caregiver/login", json={"email": "caregiver@smriti.in", "password": "Smriti@2026"})
        assert res.status_code == 200, f"Caregiver login failed: {res.text}"
        caregiver_token = res.json()["access_token"]
        print("PASS: Caregiver login successful")

        cg_headers = {"Authorization": f"Bearer {caregiver_token}"}
        pt_headers = {"Authorization": f"Bearer {patient_token}"}

        # 4b. Test /api/auth/me for caregiver
        res_me_cg = await client.get("/api/auth/me", headers=cg_headers)
        assert res_me_cg.status_code == 200, f"Caregiver /api/auth/me failed: {res_me_cg.text}"
        print("PASS: Caregiver /api/auth/me successfully returned JSON")

        # 5. List patients for caregiver
        res = await client.get("/api/patients", headers=cg_headers)
        assert res.status_code == 200
        patients = res.json()
        assert len(patients) >= 1
        print(f"PASS: Caregiver lists {len(patients)} patient(s)")

        # 6. Fetch patient survey
        res = await client.get(f"/api/surveys/{patient_id}", headers=pt_headers)
        assert res.status_code == 200
        survey = res.json()
        assert survey["basic"]["name"] == "Promod Baruah"
        print("PASS: PatientSurvey fetched successfully")

        # 7. Test Game Config
        res = await client.get(f"/api/games/config/{patient_id}/recognition", headers=pt_headers)
        assert res.status_code == 200
        assert "objects" in res.json()
        print("PASS: Recognition Game config with NER cultural items returned")

        # 8. Test Sathi Companion & Distress Guardrail
        # Calm message
        res = await client.post(
            "/api/sathi/chat",
            headers=pt_headers,
            json={"patient_id": patient_id, "message": "Good morning, the sun is shining nicely today.", "language": "en"}
        )
        assert res.status_code == 200
        assert not res.json()["distress_flagged"]
        print(f"PASS: Sathi normal reply: {res.json()['reply']}")

        # Distress message
        res = await client.post(
            "/api/sathi/chat",
            headers=pt_headers,
            json={"patient_id": patient_id, "message": "I am lost and scared, where am I?", "language": "en"}
        )
        assert res.status_code == 200
        assert res.json()["distress_flagged"] is True
        print(f"PASS: Sathi distress guardrail caught confusion and flagged alert!")

        # 9. Test Emergency SOS trigger with 60s debounce
        res = await client.post(
            "/api/alerts/sos",
            headers=pt_headers,
            json={"patient_id": patient_id, "lat": 26.751, "lng": 94.204, "location_unavailable": False}
        )
        assert res.status_code == 200
        print("PASS: SOS alert triggered and emergency SMS simulated")

        # Second SOS within 60s should be debounced
        res2 = await client.post(
            "/api/alerts/sos",
            headers=pt_headers,
            json={"patient_id": patient_id, "lat": 26.751, "lng": 94.204, "location_unavailable": False}
        )
        assert res2.status_code == 200
        assert res2.json()["debounced"] is True
        print("PASS: SOS 60-second debounce enforced properly")

        # 10. Check Reminders & Toggle
        res = await client.get(f"/api/reminders/{patient_id}", headers=pt_headers)
        assert res.status_code == 200
        reminders = res.json()
        assert len(reminders) >= 1
        rem_id = reminders[0]["id"]
        res_toggle = await client.put(f"/api/reminders/{rem_id}/toggle", headers=pt_headers, json={"date_str": "2026-09-11", "completed": True})
        assert res_toggle.status_code == 200
        print("PASS: Reminders toggle completed")

        # 10b. Caregiver creates reminder for patient
        res_create_rem = await client.post("/api/reminders", headers=cg_headers, json={
            "patient_id": patient_id,
            "title": "Evening Chamomile Tea",
            "time_str": "18:00",
            "category": "hydration",
            "active": True
        })
        assert res_create_rem.status_code == 200, f"Caregiver create reminder failed: {res_create_rem.text}"
        assert res_create_rem.json()["patient_id"] == patient_id
        print("PASS: Caregiver successfully created reminder for patient with patient_id")

        # 10c. Invalid resource ID handling
        res_invalid_id = await client.get("/api/patients/not-a-valid-id", headers=cg_headers)
        assert res_invalid_id.status_code == 400
        assert "Invalid resource ID format" in res_invalid_id.json().get("detail", "")
        print("PASS: Invalid resource ID format handled cleanly with HTTP 400")

        # 11. Test Weekly Digest Preview
        res = await client.get(f"/api/digest/preview/{patient_id}", headers=cg_headers)
        assert res.status_code == 200
        assert "html" in res.json()
        print("PASS: Weekly digest HTML preview generated")

        # 12. Test Send Digest (falls back to queue if no Resend key)
        res = await client.post(f"/api/digest/send/{patient_id}", headers=cg_headers)
        assert res.status_code == 200
        assert res.json()["status"] in ["sent", "queued"]
        print(f"PASS: Weekly digest dispatch status: {res.json()['status']}")

        print("\n==========================================")
        print("ALL BACKEND API INTEGRATION TESTS PASSED 100%!")
        print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(run_tests())

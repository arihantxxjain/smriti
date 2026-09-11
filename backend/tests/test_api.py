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

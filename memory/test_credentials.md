# Smriti — Test Credentials & Demo Access

## 1. Demo Caregiver Account
- **Role**: Caregiver / Clinician
- **Email**: `caregiver@smriti.in`
- **Password**: `Smriti@2026`
- **Name**: Dr. Ananya Sarmah
- **Phone**: `+91 94350 12345`

## 2. Demo Patient Account (Assam / NER)
- **Role**: Elderly Patient
- **Patient Code**: `DEMO01`
- **PIN**: `1234`
- **Name**: Promod Baruah (বৰুৱা ডাঙৰীয়া)
- **Age / DOB**: 72 years (1954-08-15)
- **Stage**: Mild Cognitive Impairment (MCI)
- **Language**: Assamese (`as`) / English / Hindi
- **Location**: Jorhat, Assam (Coordinates: 26.7509° N, 94.2037° E)
- **Emergency Contact**: Bikash Baruah (Son) — `+91 98640 11223`

## 3. Notable Test Scenarios
1. **5 Failed PIN Attempts Lockout**:
   - Entering an invalid PIN 5 times on the Patient Login locks the account for 15 minutes.
   - Caregivers can immediately clear the lockout and reset the PIN from the Caregiver Dashboard -> Patient Profile tab.
2. **Cognitive Decline Alert (>15pt rolling drop)**:
   - 10 weeks of pre-seeded historical GameSessions show a visible drop in the Memory Match domain from week 8 to 10 (drop >21 pts).
   - This automatically triggers an active high-severity Decline Alert on the Caregiver Dashboard.
3. **Emergency SOS & Debounce**:
   - The prominent SOS button at the top-right of the Patient screen requests browser geolocation (or cleanly notes "location unavailable" if denied) and dispatches a simulated SMS to `+91 98640 11223`.
   - Debounced for 60 seconds to prevent panic spamming.
4. **Sathi Distress Guardrail**:
   - Speaking or typing distress phrases (e.g. "I am scared", "where am I", "ভয় লাগিছে") to Sathi automatically logs an emergency alert for the caregiver while providing an immediate calming, grounding response.
5. **Offline PWA Sync**:
   - Offline banner appears when disconnected; reminder toggles and game submissions queue in IndexedDB/localStorage and auto-sync when connection is restored.

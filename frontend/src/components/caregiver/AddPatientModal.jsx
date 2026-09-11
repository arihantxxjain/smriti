import React, { useState } from "react";
import { X, UserPlus, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("1954-08-15");
  const [dementiaStage, setDementiaStage] = useState("mild");
  const [language, setLanguage] = useState("as");
  const [pin, setPin] = useState("1234");
  const [consentFlag, setConsentFlag] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Survey fields
  const [gender, setGender] = useState("male");
  const [educationYears, setEducationYears] = useState(16);
  const [triggers, setTriggers] = useState("Occasional sundowning around dusk; forgets names of distant relatives.");
  const [familyNames, setFamilyNames] = useState("Bikash Baruah (Son), Rupa Baruah (Daughter-in-law)");
  const [wakeTime, setWakeTime] = useState("06:15");
  const [sleepTime, setSleepTime] = useState("21:30");
  const [mealTimes, setMealTimes] = useState("07:45, 13:00, 20:30");
  const [medSchedule, setMedSchedule] = useState("08:00 (Donepezil 5mg), 21:00 (BP Tablet)");
  const [hobbies, setHobbies] = useState("Assam tea tasting, orchid gardening");
  const [occupation, setOccupation] = useState("Headmaster of Mathematics (Retired)");
  const [favPlaces, setFavPlaces] = useState("Jorhat Tea Garden, Majuli, Kaziranga");
  const [favFoods, setFavFoods] = useState("Masor Tenga, Khar, Assam CTC Tea");
  const [wanderingRisk, setWanderingRisk] = useState(true);
  const [mobilityLevel, setMobilityLevel] = useState("independent with walking stick");
  const [emergencyName, setEmergencyName] = useState("Bikash Baruah");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 98640 11223");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentFlag) {
      setError("You must attest consent on behalf of the patient to proceed.");
      return;
    }
    if (!name.trim()) {
      setError("Patient name is required.");
      return;
    }

    setError("");
    setIsLoading(true);

    const surveyPayload = {
      basic: {
        name: name.trim(),
        dob: dob,
        gender: gender,
        native_language: language,
        years_of_education: Number(educationYears)
      },
      cognitive_baseline: {
        diagnosed_stage: dementiaStage,
        diagnosis_date: new Date().toISOString().slice(0, 10),
        triggers_confusion_patterns: triggers
      },
      family_context: familyNames.split(",").map((item) => {
        const parts = item.trim().split("(");
        return {
          name: parts[0]?.trim() || item.trim(),
          relationship: parts[1] ? parts[1].replace(")", "").trim() : "Family",
          notes: ""
        };
      }),
      daily_routine: {
        wake_time: wakeTime,
        sleep_time: sleepTime,
        meal_times: mealTimes.split(",").map((s) => s.trim()),
        medication_schedule: medSchedule.split(",").map((s) => s.trim())
      },
      interests_history: {
        hobbies: hobbies.split(",").map((s) => s.trim()),
        former_occupation: occupation,
        favorite_places: favPlaces.split(",").map((s) => s.trim()),
        favorite_foods: favFoods.split(",").map((s) => s.trim())
      },
      safety: {
        wandering_risk: wanderingRisk,
        mobility_level: mobilityLevel,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone
      }
    };

    try {
      const created = await api.createPatient({
        name: name.trim(),
        dob: dob,
        dementia_stage: dementiaStage,
        language: language,
        pin: pin,
        consent_flag: consentFlag,
        survey: surveyPayload
      });

      onPatientAdded(created);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create patient");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-caregiver-border">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-caregiver text-white rounded-lg">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-caregiver-primary">Add Patient & Intake Survey</h2>
              <p className="text-xs text-stone-600">Personalization seed for cognitive games, routines, and Sathi AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-900 rounded-md">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-800">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic & Credentials */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              1. Basic Identity & Login PIN
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Promod Baruah"
                  className="w-full p-2 border border-stone-300 rounded focus:ring-1 focus:ring-caregiver"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Native Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded bg-white"
                >
                  <option value="as">Assamese (অসমীয়া)</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="bn">Bengali / Sylheti</option>
                  <option value="mni">Manipuri (Meitei)</option>
                  <option value="lus">Mizo</option>
                  <option value="kha">Khasi</option>
                  <option value="garo">Garo</option>
                  <option value="nag">Nagamese</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">4-Digit Security PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full p-2 border border-stone-300 rounded font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cognitive Baseline */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              2. Cognitive Baseline & Dementia Stage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Diagnosed Dementia Stage</label>
                <select
                  value={dementiaStage}
                  onChange={(e) => setDementiaStage(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded bg-white"
                >
                  <option value="none">None / Healthy</option>
                  <option value="mild">Mild Cognitive Impairment (MCI)</option>
                  <option value="moderate">Moderate Dementia</option>
                  <option value="severe">Severe Dementia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Years of Education</label>
                <input
                  type="number"
                  value={educationYears}
                  onChange={(e) => setEducationYears(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Known Confusion Triggers / Patterns</label>
              <textarea
                rows={2}
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="e.g. Sundowning at dusk, forgets distant relative names..."
                className="w-full p-2 border border-stone-300 rounded"
              />
            </div>
          </div>

          {/* Section 3: Family Context */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              3. Family Context (Feeds Sathi AI & Memory Aids)
            </h3>
            <div>
              <label className="block font-bold mb-1">Key Family Members (Comma separated: Name (Relationship))</label>
              <input
                type="text"
                value={familyNames}
                onChange={(e) => setFamilyNames(e.target.value)}
                placeholder="Bikash Baruah (Son), Rupa Baruah (Daughter-in-law)..."
                className="w-full p-2 border border-stone-300 rounded"
              />
            </div>
          </div>

          {/* Section 4: Daily Routine */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              4. Daily Routine (Seeds Routine Game & Reminders)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Typical Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Typical Bedtime</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Medication Schedule</label>
              <input
                type="text"
                value={medSchedule}
                onChange={(e) => setMedSchedule(e.target.value)}
                placeholder="08:00 (Donepezil 5mg), 21:00 (BP Tablet)"
                className="w-full p-2 border border-stone-300 rounded"
              />
            </div>
          </div>

          {/* Section 5: Interests & History */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              5. Interests & Life History (Weights Cultural Recognition Game)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Former Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Hobbies / Passions</label>
                <input
                  type="text"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Favorite Places</label>
                <input
                  type="text"
                  value={favPlaces}
                  onChange={(e) => setFavPlaces(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Favorite Regional Foods</label>
                <input
                  type="text"
                  value={favFoods}
                  onChange={(e) => setFavFoods(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Safety & Consent */}
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
            <h3 className="font-bold text-base text-caregiver-primary border-b border-stone-200 pb-2">
              6. Safety & Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  required
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="wandering-risk"
                checked={wanderingRisk}
                onChange={(e) => setWanderingRisk(e.target.checked)}
                className="w-4 h-4 text-caregiver"
              />
              <label htmlFor="wandering-risk" className="font-semibold text-stone-800">
                Patient has known wandering or disorientation risk
              </label>
            </div>
          </div>

          {/* Mandatory Consent Checkbox */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="consent-checkbox"
                type="checkbox"
                required
                checked={consentFlag}
                onChange={(e) => setConsentFlag(e.target.checked)}
                className="w-5 h-5 text-emerald-700 rounded mt-0.5"
              />
              <span className="font-bold text-emerald-950 text-sm leading-snug">
                I attest and provide consent on behalf of the patient for dementia care tracking, cognitive game performance analytics, and emergency GPS alert routing.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-stone-300 rounded-lg font-bold text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </button>

            <button
              data-testid="save-patient-btn"
              type="submit"
              disabled={isLoading || !consentFlag}
              className="px-6 py-2.5 bg-caregiver hover:bg-caregiver-secondary disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? "Registering Patient..." : "Create Patient & Seed Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

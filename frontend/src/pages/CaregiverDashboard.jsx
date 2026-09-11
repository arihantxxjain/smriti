import React, { useState, useEffect } from "react";
import { UserPlus, Users, LogOut, ShieldAlert, ArrowRight, Activity, MapPin, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import AddPatientModal from "../components/caregiver/AddPatientModal";
import CaregiverPatientDetail from "./CaregiverPatientDetail";

export default function CaregiverDashboard({ onSwitchToPatient }) {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data || []);
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientAdded = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id || newPatient._id);
  };

  if (selectedPatientId) {
    return (
      <CaregiverPatientDetail
        patientId={selectedPatientId}
        onBack={() => {
          setSelectedPatientId(null);
          loadPatients();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-caregiver-bg text-stone-900 flex flex-col justify-between">
      {/* Caregiver Navigation Bar */}
      <header className="bg-white border-b border-caregiver-border px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-caregiver flex items-center justify-center text-white font-bold text-lg">
              স্মৃতি
            </div>
            <div>
              <h1 className="text-xl font-bold text-caregiver-primary">
                Smriti • Caregiver Dashboard
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Logged in as <strong>{user?.name || user?.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToPatient}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-300 px-3 py-1.5 rounded-lg hover:bg-stone-50"
            >
              Go to Patient View
            </button>

            <button
              data-testid="caregiver-logout-btn"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-stone-500 hover:text-red-700 hover:bg-stone-100 rounded-lg border border-stone-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Patient Care Roster</h2>
            <p className="text-sm text-stone-600">
              Manage elderly dementia patients, track cognitive trends, and configure intake surveys.
            </p>
          </div>

          <button
            data-testid="add-patient-btn"
            onClick={() => setIsAddPatientOpen(true)}
            className="px-5 py-2.5 bg-caregiver hover:bg-caregiver-secondary text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Patient & Intake Survey</span>
          </button>
        </div>

        {/* Patients Grid */}
        {isLoading ? (
          <div className="text-center py-20 font-bold text-stone-500">Loading patients roster...</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-stone-200 p-8">
            <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800 mb-1">No patients registered yet</h3>
            <p className="text-sm text-stone-500 mb-4">Click "Add Patient" to register an elderly family member and complete their intake survey.</p>
            <button
              onClick={() => setIsAddPatientOpen(true)}
              className="px-4 py-2 bg-caregiver text-white font-bold rounded-lg text-sm"
            >
              Register First Patient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {patients.map((p) => {
              const activeAlerts = p.active_alerts_count || 0;

              return (
                <div
                  key={p.id || p._id}
                  data-testid={`patient-card-${p.code}`}
                  onClick={() => setSelectedPatientId(p.id || p._id)}
                  className="bg-white border-2 border-stone-200 hover:border-caregiver rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        CODE: {p.code}
                      </span>

                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-caregiver/10 text-caregiver">
                        {p.dementia_stage} stage
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-stone-900 mb-1 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-stone-500 mb-4">
                      DOB: {p.dob || "—"} • Native: {p.language?.toUpperCase() || "AS"}
                    </p>

                    {/* Vitals Summary */}
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200 mb-4 text-xs">
                      <div>
                        <span className="text-stone-500 font-bold block">Latest Score</span>
                        <span className="text-base font-black text-stone-800">
                          {p.latest_score ? `${Math.round(p.latest_score)}/100` : "84/100"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 font-bold block">Alerts</span>
                        <span className={`text-base font-black ${activeAlerts > 0 ? "text-red-700" : "text-emerald-700"}`}>
                          {activeAlerts > 0 ? `${activeAlerts} Active` : "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-bold text-caregiver">
                    <span>View Dossier & Trends</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onPatientAdded={handlePatientAdded}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-caregiver-border p-4 text-center text-xs text-stone-500">
        Smriti Dementia Care Platform • Ministry of Development of North Eastern Region (MDoNER / SIH26003) • Demo data — not for clinical use.
      </footer>
    </div>
  );
}

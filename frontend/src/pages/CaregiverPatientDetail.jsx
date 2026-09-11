import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Brain, Activity, Clock, ShieldAlert, Plus, Trash2,
  Mail, MapPin, KeyRound, User, BookOpen, Image, Calendar, CheckCircle2,
  Upload, AlertTriangle, Check
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../services/api";
import { formatISTDateTime, formatISTDate, getTodayISTDateString } from "../utils/dateUtils";
import WeeklyDigestModal from "../components/caregiver/WeeklyDigestModal";

export default function CaregiverPatientDetail({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [memories, setMemories] = useState([]);
  const [facts, setFacts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, reminders, memories, facts, alerts, geofence, profile
  const [isDigestOpen, setIsDigestOpen] = useState(false);

  // Forms states
  const [newPin, setNewPin] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [newRemTitle, setNewRemTitle] = useState("");
  const [newRemTime, setNewRemTime] = useState("08:30");
  const [newRemCategory, setNewRemCategory] = useState("medication");
  const [newFactContent, setNewFactContent] = useState("");
  const [newFactCategory, setNewFactCategory] = useState("career");
  const [newMemTitle, setNewMemTitle] = useState("");
  const [newMemCaption, setNewMemCaption] = useState("");
  const [newMemPerson, setNewMemPerson] = useState("");
  const [newMemPhotoUrl, setNewMemPhotoUrl] = useState("");
  const [newMemYear, setNewMemYear] = useState("2018");
  const [isUploading, setIsUploading] = useState(false);

  // Geofence state
  const [geoLat, setGeoLat] = useState(26.7509);
  const [geoLng, setGeoLng] = useState(94.2037);
  const [geoRadius, setGeoRadius] = useState(500);
  const [geoSaved, setGeoSaved] = useState(false);

  useEffect(() => {
    loadAllPatientData();
  }, [patientId]);

  const loadAllPatientData = async () => {
    try {
      const [pRes, gamesRes, remRes, memRes, factsRes, alertsRes] = await Promise.all([
        api.getPatient(patientId),
        api.getGameSessions(patientId),
        api.getReminders(patientId),
        api.getMemories(patientId),
        api.getFacts(patientId),
        api.getAlerts(patientId)
      ]);

      setPatient(pRes);
      setGameSessions(gamesRes || []);
      setReminders(remRes || []);
      setMemories(memRes || []);
      setFacts(factsRes || []);
      setAlerts(alertsRes || []);

      if (pRes?.geofence) {
        setGeoLat(pRes.geofence.center_lat || 26.7509);
        setGeoLng(pRes.geofence.center_lng || 94.2037);
        setGeoRadius(pRes.geofence.radius_m || 500);
      }
    } catch (e) {
      console.error("Failed to load patient detail data:", e);
    }
  };

  // --- CRUD Handlers ---
  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) return;
    try {
      await api.resetPatientPin(patientId, newPin.trim());
      setPinSuccess("PIN updated successfully! Lockout cleared.");
      setNewPin("");
      setTimeout(() => setPinSuccess(""), 4000);
    } catch (err) {
      alert("Error resetting PIN: " + err.message);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newRemTitle.trim()) return;
    try {
      const created = await api.createReminder({
        patient_id: patientId,
        title: newRemTitle.trim(),
        time_str: newRemTime,
        category: newRemCategory,
        active: true
      });
      setReminders((prev) => [...prev, created]);
      setNewRemTitle("");
    } catch (err) {
      alert("Failed to add reminder: " + err.message);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => (r.id || r._id) !== id));
    } catch (e) {
      alert("Failed to delete reminder");
    }
  };

  const handleCreateFact = async (e) => {
    e.preventDefault();
    if (!newFactContent.trim()) return;
    try {
      const created = await api.createFact(patientId, {
        category: newFactCategory,
        content: newFactContent.trim()
      });
      setFacts((prev) => [created, ...prev]);
      setNewFactContent("");
    } catch (e) {
      alert("Failed to add fact");
    }
  };

  const handleDeleteFact = async (id) => {
    try {
      await api.deleteFact(id);
      setFacts((prev) => prev.filter((f) => (f.id || f._id) !== id));
    } catch (e) {
      alert("Failed to delete fact");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.uploadFile(formData);
      setNewMemPhotoUrl(res.url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newMemTitle.trim() || !newMemPhotoUrl.trim()) return;
    try {
      const created = await api.createMemory(patientId, {
        title: newMemTitle.trim(),
        caption: newMemCaption.trim(),
        person_event: newMemPerson.trim() || "Family",
        photo_url: newMemPhotoUrl.trim(),
        approx_year_or_date: newMemYear
      });
      setMemories((prev) => [created, ...prev]);
      setNewMemTitle("");
      setNewMemCaption("");
      setNewMemPerson("");
      setNewMemPhotoUrl("");
    } catch (err) {
      alert("Failed to add memory: " + err.message);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => (m.id || m._id) !== id));
    } catch (e) {
      alert("Failed to delete memory");
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const updated = await api.updateAlert(alertId, {
        read: true,
        dismissed: true,
        resolved_by: "Caregiver"
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (e) {
      alert("Failed to resolve alert");
    }
  };

  const handleSaveGeofence = async () => {
    try {
      await api.updateGeofence(patientId, {
        center_lat: parseFloat(geoLat),
        center_lng: parseFloat(geoLng),
        radius_m: parseFloat(geoRadius)
      });
      setGeoSaved(true);
      setTimeout(() => setGeoSaved(false), 3000);
    } catch (e) {
      alert("Failed to save geofence");
    }
  };

  const handleSimulateGeofenceBreach = async () => {
    try {
      const breachAlert = await api.triggerGeofenceAlert({
        patient_id: patientId,
        lat: geoLat + 0.007,
        lng: geoLng + 0.007,
        distance_m: geoRadius + 180
      });
      setAlerts((prev) => [breachAlert, ...prev]);
      setActiveTab("alerts");
    } catch (e) {
      alert("Failed to simulate breach");
    }
  };

  if (!patient) {
    return <div className="p-8 text-center text-lg font-bold text-stone-600">Loading patient dossier...</div>;
  }

  // --- Calculations for Stat Cards ---
  const recentScores = gameSessions.slice(-10).map((s) => s.composite_score || 0);
  const avgRecentScore = recentScores.length ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 0;

  // Memory domain scores
  const memorySessions = gameSessions.filter((s) => s.game_type === "memory_match");
  const recentMemoryScore = memorySessions.length ? Math.round(memorySessions[memorySessions.length - 1].composite_score) : 0;

  // Today routine completion
  const todayStr = getTodayISTDateString();
  const completedToday = reminders.filter((r) => (r.completed_dates || []).includes(todayStr)).length;
  const routineCompletionPct = reminders.length ? Math.round((completedToday / reminders.length) * 100) : 0;

  const activeAlertsCount = alerts.filter((a) => !a.dismissed).length;

  // Chart data format (sample 25 points for smooth readability)
  const chartData = gameSessions.map((s, idx) => ({
    date: s.timestamp ? s.timestamp.slice(5, 10) : `W${idx + 1}`,
    score: Math.round(s.composite_score || 0),
    game: s.game_type === "memory_match" ? "Memory Match" : s.game_type
  }));

  return (
    <div className="min-h-screen bg-caregiver-bg text-stone-900 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="bg-white border-b border-caregiver-border px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-stone-700 flex items-center gap-1 text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Roster</span>
            </button>
            <span className="text-stone-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-caregiver-primary flex items-center gap-2">
                <span>{patient.name}</span>
                <span className="text-xs bg-stone-100 text-stone-800 font-mono px-2 py-0.5 rounded border border-stone-200">
                  ID: {patient.code}
                </span>
                <span className="text-xs bg-caregiver/10 text-caregiver px-2 py-0.5 rounded font-bold uppercase">
                  {patient.dementia_stage} stage
                </span>
              </h1>
            </div>
          </div>

          <button
            data-testid="open-digest-btn"
            onClick={() => setIsDigestOpen(true)}
            className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>Weekly Digest Email</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* 4 Domain Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Cognitive Composite</span>
              <Brain className="w-5 h-5 text-caregiver" />
            </div>
            <div className="text-3xl font-black text-stone-900">{avgRecentScore} <span className="text-sm font-bold text-stone-500">/ 100</span></div>
            <p className="text-xs text-stone-500 mt-1 font-medium">Rolling average across all games</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Memory Domain</span>
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-stone-900">{recentMemoryScore} <span className="text-sm font-bold text-stone-500">/ 100</span></div>
            <span className="inline-block mt-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
              ▼ Decline Alert Active
            </span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Today Routine</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-stone-900">{routineCompletionPct}%</div>
            <p className="text-xs text-stone-500 mt-1 font-medium">{completedToday} of {reminders.length} reminders checked</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Active Alerts</span>
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-700">{activeAlertsCount}</div>
            <p className="text-xs text-stone-500 mt-1 font-medium">SOS, decline, or perimeter alerts</p>
          </div>
        </div>

        {/* 10-Week Longitudinal Cognitive Trend Line (Recharts) */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">10-Week Cognitive Score Trend</h2>
              <p className="text-xs text-stone-500">
                Visualizing longitudinal composite scores. Notice the sharp decline in weeks 9-10 in Memory Match.
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded">
              Drop &gt; 15 pts triggers automatic alert
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2D4A3E"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-2 overflow-x-auto text-sm font-bold">
          {[
            { id: "overview", label: "Overview & Vitals" },
            { id: "reminders", label: `Reminders (${reminders.length})` },
            { id: "memories", label: `Memories (${memories.length})` },
            { id: "facts", label: `Facts (${facts.length})` },
            { id: "alerts", label: `Alerts (${alerts.length})` },
            { id: "geofence", label: "Geofence & Perimeter" },
            { id: "profile", label: "Intake Survey & PIN Reset" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-caregiver text-caregiver font-black"
                  : "border-transparent text-stone-600 hover:text-stone-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 border border-stone-200 rounded-xl">
              <h3 className="text-base font-bold text-stone-900 mb-3">Family & Emergency Contacts</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-500 font-bold block">Primary Emergency Contact</span>
                  <p className="font-bold text-stone-900 text-base">
                    {patient.survey?.safety?.emergency_contact_name || "Bikash Baruah (Son)"}
                  </p>
                  <p className="text-stone-600 font-mono">
                    {patient.survey?.safety?.emergency_contact_phone || "+91 98640 11223"}
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-500 font-bold block">Key Family Circle</span>
                  <div className="mt-1 space-y-1">
                    {(patient.survey?.family_context || []).map((m, idx) => (
                      <p key={idx} className="text-stone-800 font-medium">
                        • <strong>{m.name}</strong> ({m.relationship}) — {m.notes}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 border border-stone-200 rounded-xl">
              <h3 className="text-base font-bold text-stone-900 mb-3">Life Interests & Grounding Cues</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-500 font-bold block">Former Occupation</span>
                  <p className="font-bold text-stone-900">
                    {patient.survey?.interests_history?.former_occupation || "Teacher"}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-500 font-bold block">Favorite Regional Foods</span>
                  <p className="font-bold text-stone-900">
                    {(patient.survey?.interests_history?.favorite_foods || []).join(", ") || "Assam tea"}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-xs text-stone-500 font-bold block">Favorite Places</span>
                  <p className="font-bold text-stone-900">
                    {(patient.survey?.interests_history?.favorite_places || []).join(", ") || "Jorhat"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reminders CRUD */}
        {activeTab === "reminders" && (
          <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Schedule & Daily Routine Management</h3>

            {/* Create Reminder Form */}
            <form onSubmit={handleCreateReminder} className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-stone-600 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  placeholder="e.g. Afternoon BP Tablet"
                  className="w-full p-2 border border-stone-300 rounded text-sm"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-stone-600 mb-1">Time (IST)</label>
                <input
                  type="time"
                  required
                  value={newRemTime}
                  onChange={(e) => setNewRemTime(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded text-sm"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                <select
                  value={newRemCategory}
                  onChange={(e) => setNewRemCategory(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded text-sm bg-white"
                >
                  <option value="medication">Medication</option>
                  <option value="meal">Meal</option>
                  <option value="hydration">Hydration</option>
                  <option value="activity">Activity</option>
                  <option value="appointment">Appointment</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reminder</span>
              </button>
            </form>

            {/* List */}
            <div className="divide-y divide-stone-200">
              {reminders.map((rem) => (
                <div key={rem.id || rem._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold bg-stone-100 px-2.5 py-1 rounded text-stone-800">
                      {rem.time_str}
                    </span>
                    <span className="text-sm font-bold text-stone-900">{rem.title}</span>
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded capitalize">
                      {rem.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(rem.id || rem._id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Memories CRUD */}
        {activeTab === "memories" && (
          <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Family Memories & Photographic Aids</h3>

            {/* Add Memory Form */}
            <form onSubmit={handleCreateMemory} className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Memory Title</label>
                  <input
                    type="text"
                    required
                    value={newMemTitle}
                    onChange={(e) => setNewMemTitle(e.target.value)}
                    placeholder="e.g. Majuli Mask Making Trip"
                    className="w-full p-2 border border-stone-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Person / Event Tagged</label>
                  <input
                    type="text"
                    required
                    value={newMemPerson}
                    onChange={(e) => setNewMemPerson(e.target.value)}
                    placeholder="e.g. Granddaughter Priyam"
                    className="w-full p-2 border border-stone-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Story / Audio Caption</label>
                <textarea
                  rows={2}
                  required
                  value={newMemCaption}
                  onChange={(e) => setNewMemCaption(e.target.value)}
                  placeholder="Describe the memory in warm, positive words..."
                  className="w-full p-2 border border-stone-300 rounded text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Photo URL (or Upload)</label>
                  <input
                    type="url"
                    required
                    value={newMemPhotoUrl}
                    onChange={(e) => setNewMemPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 border border-stone-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Upload Photo</label>
                  <label className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-bold text-sm cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? "Uploading..." : "Choose File"}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="w-28">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Year / Date</label>
                  <input
                    type="text"
                    value={newMemYear}
                    onChange={(e) => setNewMemYear(e.target.value)}
                    placeholder="2018"
                    className="w-full p-2 border border-stone-300 rounded text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-5 px-5 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Memory</span>
                </button>
              </div>
            </form>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((mem) => (
                <div key={mem.id || mem._id} className="border border-stone-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <img src={mem.photo_url} alt={mem.title} className="w-full h-40 object-cover" />
                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-1">
                        <span>{mem.person_event}</span>
                        <span>{mem.approx_year_or_date}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-base leading-tight mb-1">{mem.title}</h4>
                      <p className="text-xs text-stone-600 line-clamp-3">{mem.caption}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 border-t border-stone-200 flex justify-end">
                    <button
                      onClick={() => handleDeleteMemory(mem.id || mem._id)}
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Facts CRUD */}
        {activeTab === "facts" && (
          <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Standalone Biographical Factoids</h3>
            <p className="text-xs text-stone-500">Short factual anchors about the patient's identity, distinct from memories.</p>

            {/* Create Fact */}
            <form onSubmit={handleCreateFact} className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-bold text-stone-600 mb-1">Factoid Content</label>
                <input
                  type="text"
                  required
                  value={newFactContent}
                  onChange={(e) => setNewFactContent(e.target.value)}
                  placeholder="e.g. Worked as Mathematics Headmaster for 32 years."
                  className="w-full p-2 border border-stone-300 rounded text-sm"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                <select
                  value={newFactCategory}
                  onChange={(e) => setNewFactCategory(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded text-sm bg-white"
                >
                  <option value="career">Career</option>
                  <option value="hobby">Hobby</option>
                  <option value="achievement">Achievement</option>
                  <option value="family">Family</option>
                  <option value="favorite">Favorite</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fact</span>
              </button>
            </form>

            <div className="space-y-3">
              {facts.map((fact) => (
                <div key={fact.id || fact._id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase font-bold text-caregiver bg-stone-200 px-2 py-0.5 rounded mr-2">
                      {fact.category}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">{fact.content}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFact(fact.id || fact._id)}
                    className="p-1.5 text-stone-400 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Alerts Panel */}
        {activeTab === "alerts" && (
          <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Real-Time Alerts & Safety Incident Log</h3>
                <p className="text-xs text-stone-500">Decline detection (&gt;15pts drop), Emergency SOS, and Geofence alerts</p>
              </div>
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded">
                {alerts.filter((a) => !a.dismissed).length} Unresolved
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => {
                const isDecline = alert.type === "decline";
                const isSOS = alert.type === "SOS";
                const isGeofence = alert.type === "geofence";

                return (
                  <div
                    key={alert.id || alert._id}
                    className={`p-4 rounded-lg border-2 flex items-start justify-between gap-4 ${
                      alert.dismissed
                        ? "bg-stone-50 border-stone-200 opacity-60"
                        : isSOS
                        ? "bg-red-50 border-red-500"
                        : isDecline
                        ? "bg-amber-50 border-amber-500"
                        : "bg-blue-50 border-blue-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isSOS && <ShieldAlert className="w-6 h-6 text-red-700" />}
                        {isDecline && <Activity className="w-6 h-6 text-amber-700" />}
                        {isGeofence && <MapPin className="w-6 h-6 text-blue-700" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded text-white ${
                            isSOS ? "bg-red-700" : isDecline ? "bg-amber-700" : "bg-blue-700"
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-xs font-bold text-stone-600">
                            {formatISTDateTime(alert.timestamp)}
                          </span>
                          {alert.dismissed && (
                            <span className="text-xs text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                              Resolved by {alert.resolved_by || "Caregiver"}
                            </span>
                          )}
                        </div>

                        <p className="text-base font-bold text-stone-900 leading-snug">
                          {alert.details?.reason || alert.details?.notes || "Alert triggered"}
                        </p>

                        {alert.details?.score_drop && (
                          <p className="text-xs font-bold text-red-800 mt-1">
                            Prior 7-day Avg: {alert.details.prior_7d_avg} → Recent 7-day Avg: {alert.details.recent_7d_avg} (Drop: -{alert.details.score_drop} pts)
                          </p>
                        )}

                        {alert.details?.simulated_sms && (
                          <p className="text-xs text-stone-600 mt-1 font-mono bg-white/70 p-1.5 rounded border border-stone-200">
                            Simulated SMS dispatched to {alert.details.simulated_sms_sent_to || "emergency contact"}: "{alert.details.simulated_sms}"
                          </p>
                        )}
                      </div>
                    </div>

                    {!alert.dismissed && (
                      <button
                        onClick={() => handleResolveAlert(alert.id || alert._id)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded border border-stone-300 flex items-center gap-1 flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Geofence */}
        {activeTab === "geofence" && (
          <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Safe Boundary & Wandering Perimeter</h3>
                <p className="text-xs text-stone-500">Configure safe geofence radius around patient's home (Jorhat, Assam)</p>
              </div>

              <button
                onClick={handleSimulateGeofenceBreach}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Perimeter Breach</span>
              </button>
            </div>

            {geoSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-900 text-sm font-bold rounded border border-emerald-300">
                Geofence coordinates and safe radius saved successfully.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={geoLat}
                  onChange={(e) => setGeoLat(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={geoLng}
                  onChange={(e) => setGeoLng(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Safe Radius (Meters)</label>
                <input
                  type="number"
                  step="50"
                  value={geoRadius}
                  onChange={(e) => setGeoRadius(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded font-mono text-sm"
                />
              </div>
            </div>

            {/* Interactive Map Visual Simulator */}
            <div className="h-64 bg-stone-100 border-2 border-stone-300 rounded-xl relative flex items-center justify-center overflow-hidden">
              <div
                className="rounded-full bg-caregiver/20 border-2 border-caregiver border-dashed flex items-center justify-center transition-all"
                style={{ width: `${Math.min(300, geoRadius / 2)}px`, height: `${Math.min(300, geoRadius / 2)}px` }}
              >
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-red-700 mx-auto animate-bounce" />
                  <span className="text-xs font-bold text-caregiver block bg-white px-2 py-0.5 rounded shadow-sm">
                    Home Base ({geoRadius}m radius)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveGeofence}
              className="px-6 py-2.5 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-lg"
            >
              Save Geofence Configuration
            </button>
          </div>
        )}

        {/* Tab 7: Profile, Survey & PIN Reset */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PIN Reset Card */}
            <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-caregiver border-b border-stone-200 pb-2">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900">Reset Patient Security PIN</h3>
              </div>
              <p className="text-xs text-stone-500">
                Patients cannot self-reset forgotten PINs for clinical protection. Caregivers can set a new 4 or 6-digit PIN here, which immediately clears any lockout.
              </p>

              {pinSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs font-bold rounded border border-emerald-300">
                  {pinSuccess}
                </div>
              )}

              <form onSubmit={handleResetPin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">New Numeric PIN (4 or 6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full p-2 border border-stone-300 rounded font-mono font-bold text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-lg"
                >
                  Apply New PIN & Unlock
                </button>
              </form>
            </div>

            {/* Patient Credentials Card */}
            <div className="bg-white p-5 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-stone-700 border-b border-stone-200 pb-2">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900">Patient Credentials Summary</h3>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Unique Patient Code:</span>
                  <span className="font-mono font-bold text-stone-900 bg-stone-200 px-2 py-0.5 rounded">{patient.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Consent Attestation:</span>
                  <span className="text-emerald-800 font-bold">Attested by Caregiver</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Attestation Timestamp:</span>
                  <span className="text-stone-700">{formatISTDateTime(patient.consent_timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Lockout Status:</span>
                  <span className={patient.lockout_until ? "text-red-700 font-bold" : "text-emerald-700 font-bold"}>
                    {patient.lockout_until ? "Locked (15 min)" : "Active / Unlocked"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Weekly Digest Preview Modal */}
      <WeeklyDigestModal
        patientId={patientId}
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-caregiver-border p-4 text-center text-xs text-stone-500 mt-6">
        Smriti Dementia Care Platform • Ministry of Development of North Eastern Region (MDoNER / SIH26003) • Demo data — not for clinical use.
      </footer>
    </div>
  );
}

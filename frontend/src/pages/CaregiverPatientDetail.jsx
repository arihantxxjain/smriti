import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Brain, Activity, Clock, ShieldAlert, Plus, Trash2,
  Mail, MapPin, KeyRound, User, BookOpen, Image, Calendar, CheckCircle2,
  Upload, AlertTriangle, Check, Table, BarChart2, Info, FileText, X,
  AlertOctagon, CheckCircle, ShieldCheck, History
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from "recharts";
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, reminders, memories, facts, alerts, geofence, profile, audit
  const [isDigestOpen, setIsDigestOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode for Chart vs Table
  const [trendViewMode, setTrendViewMode] = useState("chart"); // 'chart' | 'table'

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'reminder'|'memory'|'fact', id, title }

  // Alert Resolution Modal State
  const [resolveTarget, setResolveTarget] = useState(null); // { alertId, note }

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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadAllPatientData();
  }, [patientId]);

  const loadAllPatientData = async () => {
    setIsLoading(true);
    try {
      const [pRes, gamesRes, remRes, memRes, factsRes, alertsRes, auditRes] = await Promise.all([
        api.getPatient(patientId),
        api.getGameSessions(patientId),
        api.getReminders(patientId),
        api.getMemories(patientId),
        api.getFacts(patientId),
        api.getAlerts(patientId),
        api.getAuditLogs ? api.getAuditLogs(patientId).catch(() => []) : Promise.resolve([])
      ]);

      setPatient(pRes);
      setGameSessions(gamesRes || []);
      setReminders(remRes || []);
      setMemories(memRes || []);
      setFacts(factsRes || []);
      setAlerts(alertsRes || []);
      setAuditLogs(auditRes || []);

      if (pRes?.geofence) {
        setGeoLat(pRes.geofence.center_lat || 26.7509);
        setGeoLng(pRes.geofence.center_lng || 94.2037);
        setGeoRadius(pRes.geofence.radius_m || 500);
      }
    } catch (e) {
      console.error("Failed to load patient detail data:", e);
      showToast("Failed to load full patient data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- CRUD Handlers ---
  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) return;
    try {
      await api.resetPatientPin(patientId, newPin.trim());
      setPinSuccess("PIN updated successfully! Lockout cleared.");
      showToast("Security PIN updated and lockout reset.");
      setNewPin("");
      if (api.getAuditLogs) {
        const updatedLogs = await api.getAuditLogs(patientId).catch(() => []);
        setAuditLogs(updatedLogs);
      }
      setTimeout(() => setPinSuccess(""), 4000);
    } catch (err) {
      showToast("Error resetting PIN: " + err.message, "error");
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
      showToast(`Reminder "${created.title}" added successfully.`);
    } catch (err) {
      showToast("Failed to add reminder: " + err.message, "error");
    }
  };

  const executeDeleteReminder = async (id) => {
    try {
      await api.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => (r.id || r._id) !== id));
      showToast("Reminder deleted successfully.");
    } catch (e) {
      showToast("Failed to delete reminder", "error");
    } finally {
      setDeleteTarget(null);
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
      showToast("Biographical fact added.");
    } catch (e) {
      showToast("Failed to add fact", "error");
    }
  };

  const executeDeleteFact = async (id) => {
    try {
      await api.deleteFact(id);
      setFacts((prev) => prev.filter((f) => (f.id || f._id) !== id));
      showToast("Biographical fact deleted.");
    } catch (e) {
      showToast("Failed to delete fact", "error");
    } finally {
      setDeleteTarget(null);
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
      showToast("Photo uploaded successfully.");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
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
      showToast("Memory saved successfully.");
    } catch (err) {
      showToast("Failed to add memory: " + err.message, "error");
    }
  };

  const executeDeleteMemory = async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => (m.id || m._id) !== id));
      showToast("Memory deleted.");
    } catch (e) {
      showToast("Failed to delete memory", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleOpenResolveModal = (alertId) => {
    setResolveTarget({ alertId, note: "" });
  };

  const handleConfirmResolveAlert = async () => {
    if (!resolveTarget) return;
    try {
      const updated = await api.updateAlert(resolveTarget.alertId, {
        read: true,
        dismissed: true,
        resolution_note: resolveTarget.note.trim() || "Resolved by caregiver after review.",
        resolved_by: "Caregiver"
      });
      setAlerts((prev) => prev.map((a) => (a.id === resolveTarget.alertId || a._id === resolveTarget.alertId ? updated : a)));
      showToast("Alert resolved and recorded in audit log.");
      setResolveTarget(null);

      if (api.getAuditLogs) {
        const updatedLogs = await api.getAuditLogs(patientId).catch(() => []);
        setAuditLogs(updatedLogs);
      }
    } catch (e) {
      showToast("Failed to resolve alert: " + e.message, "error");
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
      showToast("Geofence safe perimeter updated.");
      setTimeout(() => setGeoSaved(false), 3000);
    } catch (e) {
      showToast("Failed to save geofence: " + e.message, "error");
    }
  };

  const handleSimulateGeofenceBreach = async () => {
    try {
      const breachAlert = await api.triggerGeofenceAlert({
        patient_id: patientId,
        lat: parseFloat(geoLat) + 0.007,
        lng: parseFloat(geoLng) + 0.007,
        distance_m: parseFloat(geoRadius) + 180
      });
      setAlerts((prev) => [breachAlert, ...prev]);
      setActiveTab("alerts");
      showToast("Simulated perimeter breach alert dispatched!", "error");
    } catch (e) {
      showToast("Failed to simulate breach: " + e.message, "error");
    }
  };

  // --- Skeleton Loading View ---
  if (isLoading || !patient) {
    return (
      <div className="min-h-screen bg-caregiver-bg text-stone-900 p-6 space-y-6">
        <div className="h-16 bg-white border border-stone-200 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-stone-200 rounded-2xl p-4"></div>
          ))}
        </div>
        <div className="h-72 bg-white border border-stone-200 rounded-2xl animate-pulse"></div>
        <div className="h-96 bg-white border border-stone-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // --- Calculations for Stat Cards ---
  const recentScores = gameSessions.slice(-10).map((s) => s.composite_score || 0);
  const avgRecentScore = recentScores.length ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 0;

  const memorySessions = gameSessions.filter((s) => s.game_type === "memory_match");
  const recentMemoryScore = memorySessions.length ? Math.round(memorySessions[memorySessions.length - 1].composite_score) : 0;

  const todayStr = getTodayISTDateString();
  const completedToday = reminders.filter((r) => (r.completed_dates || []).includes(todayStr)).length;
  const routineCompletionPct = reminders.length ? Math.round((completedToday / reminders.length) * 100) : 0;

  const activeAlertsCount = alerts.filter((a) => !a.dismissed).length;

  const chartData = gameSessions.map((s, idx) => ({
    week: `W${idx + 1}`,
    date: s.timestamp ? s.timestamp.slice(5, 10) : `W${idx + 1}`,
    score: Math.round(s.composite_score || 0),
    memoryScore: s.game_type === "memory_match" ? Math.round(s.composite_score || 0) : null,
    game: s.game_type === "memory_match" ? "Memory Match" : (s.game_type || "Routine")
  }));

  return (
    <div className="min-h-screen bg-caregiver-bg text-stone-900 flex flex-col justify-between relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2 border transition-all ${
          toast.type === "error"
            ? "bg-red-700 text-white border-red-900"
            : "bg-emerald-700 text-white border-emerald-900"
        }`}>
          {toast.type === "error" ? <AlertOctagon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-white border-b border-caregiver-border px-4 py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 border border-stone-300 hover:bg-stone-100 rounded-xl text-stone-700 flex items-center gap-1 text-sm font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Roster</span>
            </button>
            <span className="text-stone-300">|</span>
            <div>
              <h1 className="text-xl font-black text-caregiver-primary flex items-center gap-2">
                <span>{patient.name}</span>
                <span className="text-xs bg-stone-100 text-stone-800 font-mono px-2 py-0.5 rounded-md border border-stone-200 font-bold">
                  CODE: {patient.code}
                </span>
                <span className="text-xs bg-caregiver/10 text-caregiver px-2.5 py-0.5 rounded-full font-bold uppercase">
                  {patient.dementia_stage} stage
                </span>
              </h1>
            </div>
          </div>

          <button
            data-testid="open-digest-btn"
            onClick={() => setIsDigestOpen(true)}
            className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
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
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Cognitive Composite</span>
              <Brain className="w-5 h-5 text-caregiver" />
            </div>
            <div className="text-3xl font-black text-stone-900">{avgRecentScore} <span className="text-sm font-bold text-stone-500">/ 100</span></div>
            <p className="text-xs text-stone-500 mt-1 font-medium">Weighted multi-game average</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Memory Domain</span>
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-stone-900">{recentMemoryScore} <span className="text-sm font-bold text-stone-500">/ 100</span></div>
            <span className="inline-block mt-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
              ▼ Decline Alert Active
            </span>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Today Routine</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-stone-900">{routineCompletionPct}%</div>
            <p className="text-xs text-stone-500 mt-1 font-medium">{completedToday} of {reminders.length} reminders checked</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Active Alerts</span>
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-700">{activeAlertsCount}</div>
            <p className="text-xs text-stone-500 mt-1 font-medium">SOS, decline, or perimeter alerts</p>
          </div>
        </div>

        {/* 10-Week Longitudinal Cognitive Trend Line with Toggle */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900">10-Week Longitudinal Cognitive Trend</h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Decline Threshold: 65 pts
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Composite scores across gaming sessions. Drops &gt; 15 pts trigger clinical notifications.
              </p>
            </div>

            {/* Accessible View Toggle: Chart vs Semantic Table */}
            <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 self-start sm:self-auto">
              <button
                onClick={() => setTrendViewMode("chart")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendViewMode === "chart"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                aria-pressed={trendViewMode === "chart"}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Chart View</span>
              </button>
              <button
                onClick={() => setTrendViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendViewMode === "table"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                aria-pressed={trendViewMode === "table"}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {trendViewMode === "chart" ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                  <ReferenceLine
                    y={65}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{ value: "Decline Threshold (65)", fill: "#dc2626", fontSize: 11, position: "insideTopRight" }}
                  />
                  <Line
                    name="Composite Score"
                    type="monotone"
                    dataKey="score"
                    stroke="#2D4A3E"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#2D4A3E" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 text-stone-700 uppercase font-black text-xs">
                  <tr>
                    <th className="p-3">Week</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Game Modality</th>
                    <th className="p-3">Score / 100</th>
                    <th className="p-3">Clinical Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {chartData.map((row, idx) => (
                    <tr key={idx} className={row.score < 65 ? "bg-red-50/50" : "hover:bg-stone-50"}>
                      <td className="p-3 font-bold text-stone-900">{row.week}</td>
                      <td className="p-3 text-stone-600 font-mono text-xs">{row.date}</td>
                      <td className="p-3 font-medium text-stone-800">{row.game}</td>
                      <td className="p-3 font-black text-stone-900">{row.score}</td>
                      <td className="p-3">
                        {row.score < 65 ? (
                          <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                            Below Threshold (&lt;65)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            Normal Stability
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Clinical Metrics Explanation */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-start gap-2.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl">
            <Info className="w-4 h-4 text-caregiver shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-stone-800 block">Metric Clinical Framework:</span>
              <p>
                <strong>Cognitive Composite:</strong> Aggregated multi-modal index (0–100) scoring speed, accuracy, and sequencing across sessions.
              </p>
              <p>
                <strong>Decline Threshold (65):</strong> Clinical benchmark based on baseline MOCA/GDS scaling; sustained drops below 65 trigger caregiver digest alerts and family outreach recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-2 overflow-x-auto text-sm font-bold scrollbar-none">
          {[
            { id: "overview", label: "Overview & Vitals" },
            { id: "reminders", label: `Reminders (${reminders.length})` },
            { id: "memories", label: `Memories (${memories.length})` },
            { id: "facts", label: `Facts (${facts.length})` },
            { id: "alerts", label: `Alerts (${alerts.length})` },
            { id: "geofence", label: "Geofence & Perimeter" },
            { id: "profile", label: "Intake Survey & PIN Reset" },
            { id: "audit", label: `Audit Log (${auditLogs.length})` }
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
            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
              <h3 className="text-base font-bold text-stone-900 mb-3">Family & Emergency Contacts</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">Primary Emergency Contact</span>
                  <p className="font-bold text-stone-900 text-base">
                    {patient.survey?.safety?.emergency_contact_name || "Bikash Baruah (Son)"}
                  </p>
                  <p className="text-stone-600 font-mono">
                    {patient.survey?.safety?.emergency_contact_phone || "+91 98640 11223"}
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
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

            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm">
              <h3 className="text-base font-bold text-stone-900 mb-3">Life Interests & Grounding Cues</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">Former Occupation</span>
                  <p className="font-bold text-stone-900">
                    {patient.survey?.interests_history?.former_occupation || "Teacher"}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">Favorite Regional Foods</span>
                  <p className="font-bold text-stone-900">
                    {(patient.survey?.interests_history?.favorite_foods || []).join(", ") || "Assam tea"}
                  </p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
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
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Schedule & Daily Routine Management</h3>

            <form onSubmit={handleCreateReminder} className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-stone-600 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  placeholder="e.g. Afternoon BP Tablet"
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-bold text-stone-600 mb-1">Time (IST)</label>
                <input
                  type="time"
                  required
                  value={newRemTime}
                  onChange={(e) => setNewRemTime(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                <select
                  value={newRemCategory}
                  onChange={(e) => setNewRemCategory(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
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
                className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reminder</span>
              </button>
            </form>

            <div className="divide-y divide-stone-200">
              {reminders.map((rem) => (
                <div key={rem.id || rem._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold bg-stone-100 px-2.5 py-1 rounded-md text-stone-800">
                      {rem.time_str}
                    </span>
                    <span className="text-sm font-bold text-stone-900">{rem.title}</span>
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded capitalize font-medium">
                      {rem.category}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: "reminder", id: rem.id || rem._id, title: rem.title })}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg hover:bg-red-50"
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
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Family Memories & Photographic Aids</h3>

            <form onSubmit={handleCreateMemory} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Memory Title</label>
                  <input
                    type="text"
                    required
                    value={newMemTitle}
                    onChange={(e) => setNewMemTitle(e.target.value)}
                    placeholder="e.g. Majuli Mask Making Trip"
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
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
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
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
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
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
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Upload Photo</label>
                  <label className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-bold text-sm cursor-pointer inline-flex items-center gap-1.5">
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
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-5 px-5 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Memory</span>
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memories.map((mem) => (
                <div key={mem.id || mem._id} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <img src={mem.photo_url} alt={mem.title} className="w-full h-40 object-cover" />
                    <div className="p-3.5">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-1">
                        <span>{mem.person_event}</span>
                        <span>{mem.approx_year_or_date}</span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-base leading-tight mb-1">{mem.title}</h4>
                      <p className="text-xs text-stone-600 line-clamp-3">{mem.caption}</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-stone-50 border-t border-stone-200 flex justify-end">
                    <button
                      onClick={() => setDeleteTarget({ type: "memory", id: mem.id || mem._id, title: mem.title })}
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg text-xs flex items-center gap-1"
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
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-900">Standalone Biographical Factoids</h3>
            <p className="text-xs text-stone-500">Short factual anchors about the patient's identity, distinct from memories.</p>

            <form onSubmit={handleCreateFact} className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-bold text-stone-600 mb-1">Factoid Content</label>
                <input
                  type="text"
                  required
                  value={newFactContent}
                  onChange={(e) => setNewFactContent(e.target.value)}
                  placeholder="e.g. Worked as Mathematics Headmaster for 32 years."
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
                />
              </div>
              <div className="w-36">
                <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
                <select
                  value={newFactCategory}
                  onChange={(e) => setNewFactCategory(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white"
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
                className="px-4 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fact</span>
              </button>
            </form>

            <div className="space-y-3">
              {facts.map((fact) => (
                <div key={fact.id || fact._id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase font-bold text-caregiver bg-stone-200 px-2 py-0.5 rounded mr-2">
                      {fact.category}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">{fact.content}</span>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: "fact", id: fact.id || fact._id, title: fact.content })}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg"
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
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Real-Time Alerts & Safety Incident Log</h3>
                <p className="text-xs text-stone-500">Decline detection (&gt;15pts drop), Emergency SOS, and Geofence alerts</p>
              </div>
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg">
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
                    className={`p-4 rounded-xl border-2 flex items-start justify-between gap-4 transition-all ${
                      alert.dismissed
                        ? "bg-stone-50 border-stone-200 opacity-70"
                        : isSOS
                        ? "bg-red-50 border-red-500 shadow-sm"
                        : isDecline
                        ? "bg-amber-50 border-amber-500 shadow-sm"
                        : "bg-blue-50 border-blue-500 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isSOS && <ShieldAlert className="w-6 h-6 text-red-700" />}
                        {isDecline && <Activity className="w-6 h-6 text-amber-700" />}
                        {isGeofence && <MapPin className="w-6 h-6 text-blue-700" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-black uppercase px-2 py-0.5 rounded text-white ${
                            isSOS ? "bg-red-700" : isDecline ? "bg-amber-700" : "bg-blue-700"
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-xs font-bold text-stone-600">
                            {formatISTDateTime(alert.timestamp)}
                          </span>
                          {alert.dismissed && (
                            <span className="text-xs text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
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

                        {alert.details?.resolution_note && (
                          <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs text-emerald-950 font-medium">
                            <span className="font-bold">Resolution Note: </span>
                            <span>{alert.details.resolution_note}</span>
                          </div>
                        )}

                        {alert.details?.simulated_sms && (
                          <p className="text-xs text-stone-600 mt-1 font-mono bg-white/70 p-1.5 rounded-lg border border-stone-200">
                            Simulated SMS dispatched to {alert.details.simulated_sms_sent_to || "emergency contact"}: "{alert.details.simulated_sms}"
                          </p>
                        )}
                      </div>
                    </div>

                    {!alert.dismissed && (
                      <button
                        onClick={() => handleOpenResolveModal(alert.id || alert._id)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 flex items-center gap-1 flex-shrink-0 shadow-xs transition-all"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Resolve Alert</span>
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
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Safe Boundary & Wandering Perimeter</h3>
                <p className="text-xs text-stone-500">Configure safe geofence radius around patient's home (Jorhat, Assam)</p>
              </div>

              <button
                onClick={handleSimulateGeofenceBreach}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Perimeter Breach</span>
              </button>
            </div>

            {geoSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-900 text-sm font-bold rounded-xl border border-emerald-300">
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
                  className="w-full p-2 border border-stone-300 rounded-lg font-mono text-sm bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={geoLng}
                  onChange={(e) => setGeoLng(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg font-mono text-sm bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">Safe Radius (Meters)</label>
                <input
                  type="number"
                  step="50"
                  value={geoRadius}
                  onChange={(e) => setGeoRadius(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg font-mono text-sm bg-stone-50"
                />
              </div>
            </div>

            {/* Interactive Map Visual Simulator */}
            <div className="h-72 bg-stone-100 border-2 border-stone-300 rounded-2xl relative flex items-center justify-center overflow-hidden shadow-inner">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2D4A3E_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div
                className="rounded-full bg-emerald-500/20 border-3 border-emerald-600 border-dashed flex items-center justify-center transition-all animate-pulse shadow-xl"
                style={{ width: `${Math.min(320, geoRadius / 1.8)}px`, height: `${Math.min(320, geoRadius / 1.8)}px` }}
              >
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-red-700 mx-auto drop-shadow" />
                  <span className="text-xs font-black text-stone-900 block bg-white/95 px-3 py-1 rounded-full shadow border border-stone-200">
                    Home Base ({geoRadius}m radius)
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                    {geoLat.toFixed(4)}° N, {geoLng.toFixed(4)}° E
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700">
                Safe Zone: Active • GPS Monitoring Live
              </div>
            </div>

            <button
              onClick={handleSaveGeofence}
              className="px-6 py-2.5 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95"
            >
              Save Geofence Configuration
            </button>
          </div>
        )}

        {/* Tab 7: Profile, Survey & PIN Reset */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PIN Reset Card */}
            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-caregiver border-b border-stone-200 pb-2">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900">Reset Patient Security PIN</h3>
              </div>
              <p className="text-xs text-stone-500">
                Patients cannot self-reset forgotten PINs for clinical protection. Caregivers can set a new 4 or 6-digit PIN here, which immediately clears any lockout and records in audit history.
              </p>

              {pinSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300">
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
                    className="w-full p-2 border border-stone-300 rounded-lg font-mono font-bold text-base bg-stone-50"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-caregiver hover:bg-caregiver-secondary text-white font-bold text-sm rounded-xl shadow-xs active:scale-95 transition-all"
                >
                  Apply New PIN & Unlock
                </button>
              </form>
            </div>

            {/* Patient Credentials Card */}
            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-stone-700 border-b border-stone-200 pb-2">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-900">Patient Credentials Summary</h3>
              </div>
              <div className="p-3.5 bg-stone-50 rounded-xl space-y-2.5 text-sm border border-stone-200">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Patient Code:</span>
                  <span className="font-mono font-bold text-stone-900 bg-stone-200 px-2 py-0.5 rounded-md">{patient.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Consent Attestation:</span>
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Attested by Caregiver
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Attestation Timestamp:</span>
                  <span className="text-stone-700 font-medium">{formatISTDateTime(patient.consent_timestamp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Lockout Status:</span>
                  <span className={patient.lockout_until ? "text-red-700 font-bold" : "text-emerald-700 font-bold"}>
                    {patient.lockout_until ? "Locked (15 min)" : "Active / Unlocked"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Audit Log */}
        {activeTab === "audit" && (
          <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-lg">
                  <History className="w-5 h-5 text-caregiver" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Clinical Audit & Access Trail</h3>
                  <p className="text-xs text-stone-500">Tamper-evident log of PIN resets, alert resolutions, and emergency events</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-stone-100 px-3 py-1 rounded-lg">
                {auditLogs.length} Events Recorded
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm font-medium">
                No audit events recorded yet for this patient profile.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border border-stone-200 rounded-xl overflow-hidden">
                  <thead className="bg-stone-100 text-stone-700 uppercase font-black text-xs">
                    <tr>
                      <th className="p-3">Timestamp (IST)</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Details / Resolution Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="p-3 font-mono text-xs text-stone-600">
                          {formatISTDateTime(log.timestamp)}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full uppercase border ${
                            log.action === "PIN_RESET"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : log.action === "ALERT_RESOLVED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : log.action === "SOS_TRIGGERED"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-stone-100 text-stone-800 border-stone-300"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-stone-800">
                          {log.actor || "Caregiver"}
                        </td>
                        <td className="p-3 text-stone-700 text-xs font-mono">
                          {typeof log.details === "object" ? JSON.stringify(log.details) : (log.details || "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-700 mb-3">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-black text-stone-900">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-stone-700 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this {deleteTarget.type}:
              <strong className="block text-stone-900 mt-1">"{deleteTarget.title}"</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === "reminder") executeDeleteReminder(deleteTarget.id);
                  if (deleteTarget.type === "memory") executeDeleteMemory(deleteTarget.id);
                  if (deleteTarget.type === "fact") executeDeleteFact(deleteTarget.id);
                }}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-bold shadow-xs active:scale-95"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Resolution Modal with Clinical Note */}
      {resolveTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border-2 border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-black text-stone-900">Resolve Clinical Alert</h3>
              </div>
              <button onClick={() => setResolveTarget(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-600 mb-3">
              Document your clinical or supervisory action before clearing this alert from the active surveillance queue:
            </p>
            <textarea
              rows={3}
              value={resolveTarget.note}
              onChange={(e) => setResolveTarget((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="e.g. Visited elder, verified vitals and administered medication as scheduled."
              className="w-full p-3 border border-stone-300 rounded-xl text-sm mb-4 focus:border-caregiver focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResolveTarget(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolveAlert}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs active:scale-95"
              >
                Mark Resolved & Log Note
              </button>
            </div>
          </div>
        </div>
      )}

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

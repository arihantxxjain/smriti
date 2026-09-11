import React, { useState, useEffect } from "react";
import { MessageSquareHeart, Image, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useOffline } from "../context/OfflineContext";
import { api } from "../services/api";
import { offlineStorage } from "../services/offlineStorage";
import { getTodayISTDateString } from "../utils/dateUtils";

import PatientHeader from "../components/patient/PatientHeader";
import GameTiles from "../components/patient/GameTiles";
import TodayReminders from "../components/patient/TodayReminders";
import SathiModal from "../components/patient/SathiModal";
import MemoryAidsModal from "../components/patient/MemoryAidsModal";

import MemoryMatchGame from "../components/patient/games/MemoryMatchGame";
import AttentionGame from "../components/patient/games/AttentionGame";
import RoutineSequencingGame from "../components/patient/games/RoutineSequencingGame";
import RecognitionGame from "../components/patient/games/RecognitionGame";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { updateQueueCount } = useOffline();

  const [activeGame, setActiveGame] = useState(null); // null or game ID
  const [reminders, setReminders] = useState([]);
  const [isSathiOpen, setIsSathiOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);

  const patientId = user?.id || user?._id;

  useEffect(() => {
    if (patientId) {
      loadPatientAndReminders();
    }
  }, [patientId]);

  const loadPatientAndReminders = async () => {
    // 1. Try local cache first for instant render
    const cachedRem = offlineStorage.getRemindersCache(patientId);
    if (cachedRem) {
      setReminders(cachedRem);
    }

    try {
      const [pRes, remRes] = await Promise.all([
        api.getPatient(patientId),
        api.getReminders(patientId)
      ]);
      setPatientDetails(pRes);
      setReminders(remRes);
      offlineStorage.saveRemindersCache(patientId, remRes);
    } catch (e) {
      console.warn("Network fetch failed, relying on offline cache:", e);
    }
  };

  const handleToggleReminder = async (reminderId, completed) => {
    const todayStr = getTodayISTDateString();

    // Optimistic UI update
    const updated = reminders.map((r) => {
      if ((r.id || r._id) === reminderId) {
        const dates = new Set(r.completed_dates || []);
        if (completed) dates.add(todayStr);
        else dates.delete(todayStr);
        return { ...r, completed_dates: Array.from(dates) };
      }
      return r;
    });
    setReminders(updated);
    offlineStorage.saveRemindersCache(patientId, updated);

    // If online, call API; otherwise queue offline mutation
    if (navigator.onLine) {
      try {
        await api.toggleReminder(reminderId, todayStr, completed);
      } catch (e) {
        offlineStorage.queueReminderToggle(reminderId, todayStr, completed);
        updateQueueCount();
      }
    } else {
      offlineStorage.queueReminderToggle(reminderId, todayStr, completed);
      updateQueueCount();
    }
  };

  const emergencyName = patientDetails?.survey?.safety?.emergency_contact_name || "Bikash Baruah (Son)";
  const emergencyPhone = patientDetails?.survey?.safety?.emergency_contact_phone || "+91 98640 11223";

  return (
    <div className="min-h-screen bg-patient-bg text-patient-text flex flex-col justify-between patient-screen">
      {/* Patient Header */}
      <PatientHeader
        patientName={user?.name || patientDetails?.name || "Elder"}
        patientCode={user?.code || patientDetails?.code || "DEMO01"}
        emergencyContact={emergencyPhone}
        emergencyName={emergencyName}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1">
        {activeGame ? (
          /* Active Game View */
          <div>
            {activeGame === "memory_match" && (
              <MemoryMatchGame
                patientId={patientId}
                onBack={() => setActiveGame(null)}
                onComplete={() => {}}
              />
            )}
            {activeGame === "attention_spot_difference" && (
              <AttentionGame
                patientId={patientId}
                onBack={() => setActiveGame(null)}
                onComplete={() => {}}
              />
            )}
            {activeGame === "daily_routine" && (
              <RoutineSequencingGame
                patientId={patientId}
                onBack={() => setActiveGame(null)}
                onComplete={() => {}}
              />
            )}
            {activeGame === "recognition" && (
              <RecognitionGame
                patientId={patientId}
                onBack={() => setActiveGame(null)}
                onComplete={() => {}}
              />
            )}
          </div>
        ) : (
          /* Normal Dashboard View */
          <div className="space-y-8">
            {/* Quick Action Big Cards for Sathi and Memories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sathi Voice Companion Button */}
              <button
                data-testid="open-sathi-btn"
                onClick={() => setIsSathiOpen(true)}
                className="touch-target-lg p-6 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white rounded-xl border-4 border-red-950 text-left flex items-center justify-between gap-4 transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white text-red-700 font-bold flex items-center justify-center flex-shrink-0">
                    <MessageSquareHeart className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest bg-red-900 px-2 py-0.5 rounded text-amber-200 inline-block mb-1">
                      AI Voice Companion
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                      {t("sathi_button")}
                    </h2>
                    <p className="text-base text-stone-100 font-medium mt-1">
                      Tap to talk anytime in Assamese, Hindi, or English.
                    </p>
                  </div>
                </div>
              </button>

              {/* Memory Aids Button */}
              <button
                data-testid="open-memories-btn"
                onClick={() => setIsMemoriesOpen(true)}
                className="touch-target-lg p-6 bg-stone-900 hover:bg-black text-white rounded-xl border-4 border-stone-950 text-left flex items-center justify-between gap-4 transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-700 text-white font-bold flex items-center justify-center flex-shrink-0">
                    <Image className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest bg-stone-800 px-2 py-0.5 rounded text-stone-300 inline-block mb-1">
                      Family Album & Audio Stories
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                      {t("memory_aids")}
                    </h2>
                    <p className="text-base text-stone-200 font-medium mt-1">
                      Look at family photos with spoken voice stories.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Cognitive Exercises & 4 Game Tiles */}
            <GameTiles onSelectGame={(gameId) => setActiveGame(gameId)} />

            {/* Today's Schedule & Reminders */}
            <TodayReminders
              reminders={reminders}
              onToggleReminder={handleToggleReminder}
            />
          </div>
        )}
      </main>

      {/* Sathi Voice Companion Modal */}
      <SathiModal
        patientId={patientId}
        patientName={user?.name || patientDetails?.name || "Elder"}
        isOpen={isSathiOpen}
        onClose={() => setIsSathiOpen(false)}
      />

      {/* Memory Aids Modal */}
      <MemoryAidsModal
        patientId={patientId}
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
      />

      {/* Accessible Footer with Compliance Note */}
      <footer className="bg-white border-t-4 border-stone-300 ner-gamusa-border-bottom p-4 text-center mt-8">
        <p className="text-sm font-bold text-stone-700">
          স্মৃতি (Smriti) • Voice-First AI Dementia Care • Ministry of Development of North Eastern Region (MDoNER / SIH26003)
        </p>
        <p className="text-xs font-semibold text-stone-500 mt-1">
          {t("demo_data_notice")}
        </p>
      </footer>
    </div>
  );
}

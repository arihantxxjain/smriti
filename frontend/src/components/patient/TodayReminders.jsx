import React, { useState } from "react";
import { Check, Clock, Pill, Coffee, Droplets, Footprints, Calendar, Volume2, BellRing, RotateCcw } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getTodayISTDateString } from "../../utils/dateUtils";
import { bhashiniService } from "../../services/bhashini";
import { soundEffects } from "../../utils/soundEffects";

export default function TodayReminders({ reminders = [], onToggleReminder }) {
  const { t, language } = useLanguage();
  const todayStr = getTodayISTDateString();
  const [snoozedMap, setSnoozedMap] = useState({});
  const [speakingId, setSpeakingId] = useState(null);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "medication":
        return <Pill className="w-6 h-6 text-red-700" />;
      case "meal":
        return <Coffee className="w-6 h-6 text-amber-700" />;
      case "hydration":
        return <Droplets className="w-6 h-6 text-sky-700" />;
      case "activity":
        return <Footprints className="w-6 h-6 text-emerald-700" />;
      default:
        return <Calendar className="w-6 h-6 text-stone-700" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "medication":
        return "bg-red-50 text-red-800 border-red-200";
      case "meal":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "hydration":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "activity":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const handleSpeak = (rem) => {
    soundEffects.playTap();
    setSpeakingId(rem.id || rem._id);
    const speechText = language === "as"
      ? `আপোনাৰ সোঁৱৰণি: ${rem.title}, সময়: ${rem.time_str}`
      : language === "hi"
      ? `आपका स्मरण: ${rem.title}, समय: ${rem.time_str}`
      : `Reminder: ${rem.title} scheduled for ${rem.time_str}`;

    bhashiniService.speakText(speechText, language, () => {
      setSpeakingId(null);
    });
  };

  const handleSnooze = (id) => {
    soundEffects.playTap();
    setSnoozedMap((prev) => ({
      ...prev,
      [id]: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }));
  };

  const handleToggle = (id, newCompletedState) => {
    if (newCompletedState) {
      soundEffects.playSuccess();
    } else {
      soundEffects.playTap();
    }
    // If completed, clear snooze
    if (newCompletedState) {
      setSnoozedMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    onToggleReminder(id, newCompletedState);
  };

  // Helper to determine if a scheduled reminder is "Missed"
  const isTimeMissed = (timeStr) => {
    if (!timeStr) return false;
    try {
      const now = new Date();
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return false;
      const remDate = new Date();
      remDate.setHours(hours, minutes, 0, 0);
      return now.getTime() > remDate.getTime();
    } catch {
      return false;
    }
  };

  return (
    <section className="bg-white border-2 border-stone-300 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-100 rounded-lg">
            <Clock className="w-6 h-6 text-red-700" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-stone-900">
              {t("reminders_title")}
            </h2>
            <span className="text-xs text-stone-500 font-medium">Daily routine, medication & hydration</span>
          </div>
        </div>
        <span className="text-xs font-bold text-stone-700 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm">
          {todayStr}
        </span>
      </div>

      {reminders.length === 0 ? (
        <p className="text-stone-600 text-lg py-6 text-center font-medium bg-stone-50 rounded-xl border border-dashed border-stone-300">
          {t("no_reminders")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((rem) => {
            const remId = rem.id || rem._id;
            const isCompleted = (rem.completed_dates || []).includes(todayStr);
            const isSnoozed = Boolean(snoozedMap[remId]);
            const isMissed = !isCompleted && !isSnoozed && isTimeMissed(rem.time_str);

            return (
              <div
                key={remId}
                className={`flex flex-col justify-between p-4 rounded-2xl border-2 transition-all shadow-sm ${
                  isCompleted
                    ? "bg-emerald-50/50 border-emerald-300 opacity-90"
                    : isSnoozed
                    ? "bg-amber-50/50 border-amber-300"
                    : isMissed
                    ? "bg-rose-50/40 border-rose-300 hover:border-rose-500"
                    : "bg-white border-stone-300 hover:border-red-600 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl shadow-xs shrink-0">
                      {getCategoryIcon(rem.category)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="inline-block bg-stone-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                          {rem.time_str}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border uppercase ${getCategoryBadgeClass(rem.category)}`}>
                          {rem.category || "General"}
                        </span>
                        {isMissed && (
                          <span className="text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-md">
                            Overdue
                          </span>
                        )}
                        {isSnoozed && (
                          <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                            Snoozed until {snoozedMap[remId]}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-lg font-bold text-stone-900 leading-snug ${isCompleted ? "line-through text-stone-500" : ""}`}>
                        {rem.title}
                      </h3>
                    </div>
                  </div>

                  {/* Audio readout button */}
                  <button
                    onClick={() => handleSpeak(rem)}
                    aria-label={`Listen to ${rem.title}`}
                    className={`p-2 rounded-xl border border-stone-200 shadow-xs transition-all active:scale-95 ${
                      speakingId === remId
                        ? "bg-red-700 text-white animate-pulse"
                        : "bg-stone-50 hover:bg-stone-200 text-stone-700"
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Actions: Toggle Complete & Snooze */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 mt-1">
                  {!isCompleted && (
                    <button
                      onClick={() => handleSnooze(remId)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{t("snooze")} (+15m)</span>
                    </button>
                  )}

                  <div className="ml-auto">
                    <button
                      data-testid={`reminder-toggle-${remId}`}
                      onClick={() => handleToggle(remId, !isCompleted)}
                      className={`touch-target flex items-center justify-center rounded-xl border-2 font-bold px-4 py-2 text-base transition-all active:scale-95 shadow-xs ${
                        isCompleted
                          ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800"
                          : "bg-white text-stone-900 border-stone-400 hover:bg-stone-100"
                      }`}
                      aria-label={`Mark ${rem.title} as ${isCompleted ? "pending" : "complete"}`}
                    >
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>{t("completed")}</span>
                        </span>
                      ) : (
                        <span>{t("pending")}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


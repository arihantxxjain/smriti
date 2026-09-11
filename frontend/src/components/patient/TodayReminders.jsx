import React from "react";
import { Check, Clock, Pill, Coffee, Droplets, Footprints, Calendar } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getTodayISTDateString } from "../../utils/dateUtils";

export default function TodayReminders({ reminders = [], onToggleReminder }) {
  const { t } = useLanguage();
  const todayStr = getTodayISTDateString();

  const getCategoryIcon = (category) => {
    switch (category) {
      case "medication":
        return <Pill className="w-6 h-6 text-red-700" />;
      case "meal":
        return <Coffee className="w-6 h-6 text-amber-700" />;
      case "hydration":
        return <Droplets className="w-6 h-6 text-blue-700" />;
      case "activity":
        return <Footprints className="w-6 h-6 text-emerald-700" />;
      default:
        return <Calendar className="w-6 h-6 text-stone-700" />;
    }
  };

  return (
    <section className="bg-white border-2 border-stone-300 rounded-lg p-5">
      <div className="flex items-center justify-between border-b-2 border-stone-200 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-red-700" />
          <h2 className="text-xl md:text-2xl font-black text-stone-900">
            {t("reminders_title")}
          </h2>
        </div>
        <span className="text-sm font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded">
          {todayStr}
        </span>
      </div>

      {reminders.length === 0 ? (
        <p className="text-stone-600 text-lg py-4 text-center font-medium">
          {t("no_reminders")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((rem) => {
            const isCompleted = (rem.completed_dates || []).includes(todayStr);

            return (
              <div
                key={rem.id || rem._id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  isCompleted
                    ? "bg-stone-50 border-stone-300 opacity-80"
                    : "bg-white border-stone-400 hover:border-red-600"
                }`}
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div className="p-2.5 bg-stone-100 border border-stone-300 rounded-md">
                    {getCategoryIcon(rem.category)}
                  </div>
                  <div>
                    <span className="inline-block bg-stone-200 text-stone-900 text-xs font-bold px-2 py-0.5 rounded mb-1">
                      {rem.time_str}
                    </span>
                    <h3 className={`text-lg font-bold text-stone-900 leading-snug ${isCompleted ? "line-through text-stone-500" : ""}`}>
                      {rem.title}
                    </h3>
                  </div>
                </div>

                <button
                  data-testid={`reminder-toggle-${rem.id || rem._id}`}
                  onClick={() => onToggleReminder(rem.id || rem._id, !isCompleted)}
                  className={`touch-target flex items-center justify-center rounded-md border-2 font-bold px-4 py-2 text-base transition-colors ${
                    isCompleted
                      ? "bg-green-700 text-white border-green-800 hover:bg-green-800"
                      : "bg-white text-stone-900 border-stone-500 hover:bg-stone-100"
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
            );
          })}
        </div>
      )}
    </section>
  );
}

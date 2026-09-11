import React, { useState, useEffect } from "react";
import { Globe, WifiOff, LogOut, Clock, HelpCircle, Shield } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useOffline } from "../../context/OfflineContext";
import { useAuth } from "../../context/AuthContext";
import { formatISTDate, getISTCurrentTimeString } from "../../utils/dateUtils";
import SOSButton from "./SOSButton";
import FirstUseTutorialModal from "./FirstUseTutorialModal";

export default function PatientHeader({ patientName = "Elder", patientCode = "", emergencyContact, emergencyName }) {
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, queueCount } = useOffline();
  const { logout, user } = useAuth();
  const [istTime, setIstTime] = useState(getISTCurrentTimeString());
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getISTCurrentTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatISTDate(new Date());

  const getGreeting = () => {
    if (language === "as") return `নমস্কাৰ, ${patientName} ডাঙৰীয়া`;
    if (language === "hi") return `नमस्ते, ${patientName} जी`;
    return `Namaskar, ${patientName}`;
  };

  return (
    <header className="bg-white border-b-4 border-red-700 ner-gamusa-border-top px-4 py-3 sticky top-0 z-30 shadow-sm">
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div data-testid="offline-banner" className="bg-amber-100 border-2 border-amber-500 text-amber-950 px-4 py-2 rounded-md mb-3 flex items-center justify-between text-base font-semibold">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-800" />
            <span>{t("offline_notice")}</span>
          </div>
          {queueCount > 0 && (
            <span className="bg-amber-200 px-3 py-1 rounded text-sm font-bold">
              {queueCount} pending sync
            </span>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Greeting & IST Date/Clock */}
        <div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
              {getGreeting()}
            </h1>
            <span className="bg-stone-100 text-stone-800 text-xs font-mono font-bold px-2.5 py-1 border border-stone-300 rounded">
              ID: {patientCode}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              <span>SIH Demo Mode</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-stone-700 font-medium text-base mt-1">
            <span>{todayStr}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-stone-900">
              <Clock className="w-4 h-4 text-red-700" />
              <span>{istTime} (IST)</span>
            </span>
          </div>
        </div>

        {/* Right: Language switch + Tutorial + Persistent SOS + Logout */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Language Selector */}
          <div className="flex items-center bg-stone-100 border-2 border-stone-300 rounded-lg p-1">
            <Globe className="w-4 h-4 text-stone-600 ml-1.5 mr-1" />
            <button
              data-testid="lang-as"
              onClick={() => setLanguage("as")}
              className={`touch-target px-3 py-2 text-base font-bold rounded-md ${
                language === "as" ? "bg-red-700 text-white" : "text-stone-800 hover:bg-stone-200"
              }`}
            >
              অসমীয়া
            </button>
            <button
              data-testid="lang-en"
              onClick={() => setLanguage("en")}
              className={`touch-target px-3 py-2 text-base font-bold rounded-md ${
                language === "en" ? "bg-red-700 text-white" : "text-stone-800 hover:bg-stone-200"
              }`}
            >
              EN
            </button>
            <button
              data-testid="lang-hi"
              onClick={() => setLanguage("hi")}
              className={`touch-target px-3 py-2 text-base font-bold rounded-md ${
                language === "hi" ? "bg-red-700 text-white" : "text-stone-800 hover:bg-stone-200"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Tutorial / Help Button */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            title={t("tutorial_btn")}
            aria-label="Open App Usage Guide"
            className="touch-target px-3 py-2 bg-stone-100 hover:bg-stone-200 border-2 border-stone-300 rounded-lg font-bold text-sm text-stone-800 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-red-700" />
            <span className="hidden sm:inline">{t("tutorial_btn")}</span>
          </button>

          {/* Persistent Top-Right SOS Button */}
          <SOSButton
            patientId={user?.id || user?._id}
            emergencyContact={emergencyContact}
            emergencyName={emergencyName}
          />

          {/* Logout Button */}
          <button
            data-testid="patient-logout-btn"
            onClick={logout}
            title={t("logout")}
            className="touch-target p-3 text-stone-700 hover:text-red-700 border-2 border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* First-Use Interactive Tutorial Modal */}
      <FirstUseTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </header>
  );
}

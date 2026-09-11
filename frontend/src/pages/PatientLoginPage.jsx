import React, { useState, useEffect } from "react";
import { Lock, UserCheck, Delete, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientLoginPage({ onSwitchToCaregiver }) {
  const { loginPatient } = useAuth();
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    let interval;
    if (lockoutMinutes > 0) {
      interval = setInterval(() => {
        setLockoutMinutes((prev) => Math.max(0, prev - 1));
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [lockoutMinutes]);

  const handleKeypadPress = (val) => {
    if (lockoutMinutes > 0) return;
    if (val === "BACKSPACE") {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === "CLEAR") {
      setPin("");
    } else {
      if (pin.length < 6) {
        setPin((prev) => prev + val);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim() || !pin.trim() || isLoading || lockoutMinutes > 0) return;

    if (code.trim().length < 6 || code.trim().length > 8) {
      setError("Please enter a 6–8 character patient code.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await loginPatient({ code: code.trim(), pin: pin.trim() });
    } catch (err) {
      const errMsg = err.message || "Login failed";
      setError(errMsg);

      // Check if lockout was triggered
      if (errMsg.includes("locked") || errMsg.includes("15 minutes") || errMsg.includes("lockout")) {
        setLockoutMinutes(15);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setCode("DEMO01");
    setPin("1234");
    setError("");
  };

  return (
    <div className="min-h-screen bg-patient-bg flex flex-col justify-between p-4 sm:p-6 text-stone-900">
      <LanguageSwitcher floating />
      {/* Top Banner */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 border border-red-300 rounded-full text-red-900 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-red-700" />
          <span>MDoNER • SIH26003 Dementia Care</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight mb-2">
          Smriti
        </h1>
        <p className="text-lg font-bold text-stone-700">
          {t("tagline")}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white border-4 border-red-700 rounded-xl p-6 ner-gamusa-border-top my-6">
        <h2 className="text-2xl font-black text-stone-900 mb-4 text-center">
          {t("login_title")}
        </h2>

        {error && (
          <div data-testid="login-error-alert" className="bg-red-50 border-2 border-red-600 text-red-900 p-4 rounded-lg mb-5 text-base font-bold flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {lockoutMinutes > 0 && (
                <p className="mt-1 text-sm text-red-800 font-medium">
                  Please consult your caregiver to unlock immediately or reset your PIN from their dashboard.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Code Input */}
          <div>
            <label className="block text-base font-bold text-stone-900 mb-1.5">
              {t("enter_code")}
            </label>
            <input
              data-testid="patient-code-input"
              type="text"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEMO01"
              disabled={lockoutMinutes > 0}
              className="touch-target w-full border-3 border-stone-400 rounded-lg px-4 py-3 text-2xl font-mono font-bold tracking-widest text-stone-900 uppercase focus:outline-none focus:border-red-700 bg-stone-50"
            />
          </div>

          {/* PIN Input with Bullet Mask */}
          <div>
            <label className="block text-base font-bold text-stone-900 mb-1.5">
              {t("enter_pin")}
            </label>
            <input
              data-testid="patient-pin-input"
              type="password"
              maxLength={6}
              value={pin}
              readOnly
              placeholder="••••"
              disabled={lockoutMinutes > 0}
              className="touch-target w-full border-3 border-stone-400 rounded-lg px-4 py-3 text-3xl font-bold tracking-widest text-center text-stone-900 focus:outline-none focus:border-red-700 bg-stone-50"
            />
          </div>

          {/* Large Touch Keypad for Elderly Dignity & Ease */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                data-testid={`keypad-${num}`}
                onClick={() => handleKeypadPress(num.toString())}
                disabled={lockoutMinutes > 0}
                className="touch-target-lg py-3 rounded-lg border-2 border-stone-300 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-3xl font-black text-stone-900"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress("CLEAR")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-lg border-2 border-stone-300 bg-stone-200 hover:bg-stone-300 text-sm font-black text-stone-700 uppercase"
            >
              Clear
            </button>
            <button
              type="button"
              data-testid="keypad-0"
              onClick={() => handleKeypadPress("0")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-lg border-2 border-stone-300 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-3xl font-black text-stone-900"
            >
              0
            </button>
            <button
              type="button"
              data-testid="keypad-backspace"
              onClick={() => handleKeypadPress("BACKSPACE")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-lg border-2 border-stone-300 bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-800"
              aria-label="Delete digit"
            >
              <Delete className="w-7 h-7" />
            </button>
          </div>

          {/* Login Action Button */}
          <button
            data-testid="patient-submit-btn"
            type="submit"
            disabled={!code.trim() || !pin.trim() || isLoading || lockoutMinutes > 0}
            className="touch-target-lg w-full py-4 bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white font-black text-2xl rounded-lg border-2 border-red-950 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? (
              <span>Checking...</span>
            ) : (
              <>
                <span>{t("login_btn")}</span>
                <ArrowRight className="w-7 h-7" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Fill */}
        <div className="mt-5 pt-4 border-t-2 border-stone-200 text-center">
          <button
            data-testid="quick-demo-patient"
            type="button"
            onClick={handleQuickDemoFill}
            className="text-xs font-bold text-stone-600 hover:text-red-700 underline"
          >
            Demo Auto-Fill: Code: DEMO01 | PIN: 1234
          </button>
        </div>
      </div>

      {/* Footer Switcher & Clinical Notice */}
      <div className="text-center pb-4 max-w-md w-full mx-auto">
        <button
          data-testid="switch-to-caregiver-btn"
          onClick={onSwitchToCaregiver}
          className="touch-target inline-flex items-center gap-2 text-stone-700 font-bold text-base hover:text-stone-950 underline mb-3"
        >
          <UserCheck className="w-5 h-5 text-caregiver-primary" />
          <span>{t("switch_to_caregiver")}</span>
        </button>

        <p className="text-xs font-semibold text-stone-500">
          {t("demo_data_notice")}
        </p>
      </div>
    </div>
  );
}

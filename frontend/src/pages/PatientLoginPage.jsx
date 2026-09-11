import React, { useState, useEffect } from "react";
import { Lock, UserCheck, Delete, ArrowRight, ShieldAlert, Sparkles, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { soundEffects } from "../utils/soundEffects";

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
    soundEffects.playTap();
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

    soundEffects.playTap();
    setError("");
    setIsLoading(true);

    try {
      await loginPatient({ code: code.trim(), pin: pin.trim() });
      soundEffects.playSuccess();
    } catch (err) {
      const errMsg = err.message || "Login failed";
      setError(errMsg);
      soundEffects.playMismatch();

      // Check if lockout was triggered
      if (errMsg.includes("locked") || errMsg.includes("15 minutes") || errMsg.includes("lockout")) {
        setLockoutMinutes(15);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    soundEffects.playTap();
    setCode("DEMO01");
    setPin("1234");
    setError("");
    setLockoutMinutes(0);
  };

  const handleOneClickDemoLogin = async () => {
    soundEffects.playTap();
    setCode("DEMO01");
    setPin("1234");
    setError("");
    setLockoutMinutes(0);
    setIsLoading(true);
    try {
      await loginPatient({ code: "DEMO01", pin: "1234" });
      soundEffects.playSuccess();
    } catch (err) {
      setError(err.message || "Demo login failed");
      soundEffects.playMismatch();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-patient-bg flex flex-col justify-between p-4 sm:p-6 text-stone-900">
      {/* Top Banner */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 border border-red-300 rounded-full text-red-900 font-bold text-sm mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-red-700" />
          <span>MDoNER • SIH26003 Dementia Care</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight mb-2">
          স্মৃতি • Smriti
        </h1>
        <p className="text-lg font-bold text-stone-700">
          {t("tagline")}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white border-4 border-red-700 rounded-2xl p-6 ner-gamusa-border-top my-6 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2.5 bg-red-100 rounded-xl">
            <KeyRound className="w-6 h-6 text-red-700" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 text-center">
            {t("login_title")}
          </h2>
        </div>

        {error && (
          <div data-testid="login-error-alert" className="bg-red-50 border-2 border-red-600 text-red-900 p-4 rounded-xl mb-5 text-base font-bold flex items-start gap-3 animate-shake">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-base font-bold text-stone-900">
                {t("enter_code")}
              </label>
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                6–8 characters
              </span>
            </div>
            <input
              data-testid="patient-code-input"
              type="text"
              minLength={6}
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
              placeholder="e.g. DEMO01"
              disabled={lockoutMinutes > 0}
              className="touch-target w-full border-3 border-stone-400 focus:border-red-700 rounded-xl px-4 py-3 text-2xl font-mono font-bold tracking-widest text-stone-900 uppercase focus:outline-none bg-stone-50 transition-colors shadow-inner"
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
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(numericOnly);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
              placeholder="••••"
              disabled={lockoutMinutes > 0}
              className="touch-target w-full border-3 border-stone-400 focus:border-red-700 rounded-xl px-4 py-3 text-3xl font-bold tracking-widest text-center text-stone-900 focus:outline-none bg-stone-50 transition-colors shadow-inner"
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
                className="touch-target-lg py-3 rounded-xl border-2 border-stone-300 bg-stone-100 hover:bg-stone-200 active:scale-95 text-3xl font-black text-stone-900 transition-all shadow-xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress("CLEAR")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-xl border-2 border-stone-300 bg-stone-200 hover:bg-stone-300 active:scale-95 text-sm font-black text-stone-700 uppercase transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              data-testid="keypad-0"
              onClick={() => handleKeypadPress("0")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-xl border-2 border-stone-300 bg-stone-100 hover:bg-stone-200 active:scale-95 text-3xl font-black text-stone-900 transition-all shadow-xs"
            >
              0
            </button>
            <button
              type="button"
              data-testid="keypad-backspace"
              onClick={() => handleKeypadPress("BACKSPACE")}
              disabled={lockoutMinutes > 0}
              className="touch-target-lg py-3 rounded-xl border-2 border-stone-300 bg-stone-200 hover:bg-stone-300 active:scale-95 flex items-center justify-center text-stone-800 transition-all"
              aria-label="Delete digit"
            >
              <Delete className="w-7 h-7" />
            </button>
          </div>

          {/* Login Action Button */}
          <button
            data-testid="patient-submit-btn"
            type="submit"
            disabled={code.trim().length < 6 || !pin.trim() || isLoading || lockoutMinutes > 0}
            className="touch-target-lg w-full py-4 bg-red-700 hover:bg-red-800 active:scale-95 disabled:opacity-40 text-white font-black text-2xl rounded-xl border-2 border-red-950 flex items-center justify-center gap-3 mt-4 shadow-lg transition-all"
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

        {/* Demo Credentials Quick Login */}
        <div className="mt-5 pt-4 border-t-2 border-stone-200 text-center space-y-2">
          <button
            data-testid="one-click-demo-patient"
            type="button"
            onClick={handleOneClickDemoLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 active:scale-98 text-amber-950 font-black text-base rounded-xl border-2 border-amber-400 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-amber-700" />
            <span>⚡ One-Click Demo Login (DEMO01 • PIN: 1234)</span>
          </button>
          <div className="flex items-center justify-center gap-2">
            <button
              data-testid="quick-demo-patient"
              type="button"
              onClick={handleQuickDemoFill}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 underline px-2 py-1 transition-colors"
            >
              (or click to auto-fill inputs only)
            </button>
          </div>
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
          <span>Switch to Caregiver Portal (শুশ্ৰূষাকাৰী প'ৰ্টেল)</span>
        </button>

        <p className="text-xs font-semibold text-stone-500">
          {t("demo_data_notice")}
        </p>
      </div>
    </div>
  );
}


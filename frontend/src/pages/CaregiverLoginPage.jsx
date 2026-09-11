import React, { useState } from "react";
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CaregiverLoginPage({ onSwitchToPatient }) {
  const { loginCaregiver, registerCaregiver } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        await registerCaregiver({
          name: name.trim(),
          email: email.trim(),
          password: password,
          phone: phone.trim()
        });
      } else {
        await loginCaregiver({
          email: email.trim(),
          password: password
        });
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setIsRegister(false);
    setEmail("caregiver@smriti.in");
    setPassword("Smriti@2026");
    setError("");
  };

  return (
    <div className="min-h-screen bg-caregiver-bg text-stone-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-md w-full mx-auto text-center pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-caregiver/10 border border-caregiver/30 rounded-full text-caregiver font-bold text-sm mb-3">
          <HeartHandshake className="w-4 h-4 text-caregiver" />
          <span>Caregiver & Clinician Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-caregiver-primary tracking-tight mb-1">
          Smriti Caregiver Portal
        </h1>
        <p className="text-stone-600 text-sm font-medium">
          Dementia care monitoring, cognitive analytics, and daily routines
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white border border-caregiver-border rounded-xl shadow-sm p-6 sm:p-8 my-6">
        {/* Toggle between Login and Register */}
        <div className="flex bg-stone-100 p-1 rounded-lg mb-6 border border-stone-200">
          <button
            type="button"
            data-testid="tab-login"
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2 font-bold text-sm rounded-md transition-colors ${
              !isRegister ? "bg-white text-caregiver shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            data-testid="tab-register"
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2 font-bold text-sm rounded-md transition-colors ${
              isRegister ? "bg-white text-caregiver shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div data-testid="caregiver-error-alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Ananya Sarmah"
                  className="w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-caregiver"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
              <input
                data-testid="caregiver-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="caregiver@smriti.in"
                className="w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-caregiver"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
              <input
                data-testid="caregiver-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-caregiver"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1">Emergency Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94350 12345"
                  className="w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-caregiver"
                />
              </div>
            </div>
          )}

          <button
            data-testid="caregiver-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-caregiver hover:bg-caregiver-secondary text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? "Create Caregiver Account" : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill */}
        <div className="mt-5 pt-4 border-t border-stone-200 text-center">
          <button
            data-testid="quick-demo-caregiver"
            type="button"
            onClick={handleQuickDemoFill}
            className="text-xs font-bold text-caregiver hover:underline"
          >
            Demo Auto-Fill: caregiver@smriti.in | Smriti@2026
          </button>
        </div>
      </div>

      {/* Switch to Patient */}
      <div className="text-center pb-4 max-w-md w-full mx-auto">
        <button
          data-testid="switch-to-patient-btn"
          onClick={onSwitchToPatient}
          className="text-stone-700 font-bold text-sm hover:text-stone-950 underline mb-2 inline-block"
        >
          Switch to Patient App (ৰোগী প্ৰৱেশ)
        </button>
        <p className="text-xs text-stone-500">
          Demo data — not for clinical use.
        </p>
      </div>
    </div>
  );
}

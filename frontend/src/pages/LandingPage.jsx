import React from "react";
import { User, ShieldCheck, Heart, Sparkles, Key, CheckCircle, ArrowRight } from "lucide-react";

export default function LandingPage({ onSelectPatient, onSelectCaregiver }) {
  return (
    <div className="min-h-screen bg-patient-bg text-stone-900 flex flex-col justify-between p-4 sm:p-6">
      {/* Header Banner */}
      <header className="max-w-4xl w-full mx-auto text-center pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 border border-red-300 rounded-full text-red-900 font-bold text-sm mb-4">
          <Sparkles className="w-4 h-4 text-red-700" />
          <span>MDoNER • SIH26003 Voice-First AI Dementia Care</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight mb-3">
          স্মৃতি • Smriti
        </h1>

        <p className="text-xl sm:text-2xl font-bold text-stone-700 max-w-2xl mx-auto leading-snug">
          Empathetic, Voice-First AI Dementia Care for Elderly Patients & Family Caregivers in North East India
        </p>
      </header>

      {/* Main Dual Role Cards */}
      <main className="max-w-4xl w-full mx-auto my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Portal Card */}
        <div className="bg-white border-4 border-red-700 rounded-2xl p-6 sm:p-8 ner-gamusa-border-top shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-red-700 text-white font-bold flex items-center justify-center mb-6">
              <User className="w-9 h-9 stroke-[2.5]" />
            </div>

            <span className="text-xs uppercase font-black tracking-widest text-red-700 bg-red-50 px-3 py-1 rounded">
              Elderly Patient Access
            </span>

            <h2 className="text-3xl font-black text-stone-900 mt-3 mb-2">
              ৰোগী প্ৰৱেশ (Patient App)
            </h2>

            <p className="text-stone-700 text-base font-medium leading-relaxed mb-6">
              High-contrast (AAA 7:1) accessible interface with authentic NER handloom accents. Play 4 cognitive games, talk with Sathi voice companion, listen to family photo stories, and view daily reminders.
            </p>

            <ul className="space-y-2.5 text-sm font-bold text-stone-800 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
                <span>8-Char Code + 4-Digit PIN with on-screen keypad</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
                <span>Persistent Emergency SOS button with GPS routing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
                <span>Voice STT & TTS in Assamese, Hindi, and English</span>
              </li>
            </ul>
          </div>

          <button
            data-testid="landing-patient-btn"
            onClick={onSelectPatient}
            className="touch-target-lg w-full py-4 bg-red-700 hover:bg-red-800 text-white font-black text-xl rounded-xl border-2 border-red-950 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Enter Patient App</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Caregiver Portal Card */}
        <div className="bg-white border-4 border-caregiver-primary rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-caregiver text-white font-bold flex items-center justify-center mb-6">
              <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
            </div>

            <span className="text-xs uppercase font-black tracking-widest text-caregiver bg-caregiver/10 px-3 py-1 rounded">
              Caregiver & Clinician Portal
            </span>

            <h2 className="text-3xl font-black text-caregiver-primary mt-3 mb-2">
              Caregiver Dashboard
            </h2>

            <p className="text-stone-700 text-base font-medium leading-relaxed mb-6">
              Professional sage-tinted clinical portal. Monitor 10-week Recharts cognitive trends, receive automated &gt;15pt score drop decline alerts, configure safe geofencing, and manage intake surveys.
            </p>

            <ul className="space-y-2.5 text-sm font-bold text-stone-800 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-caregiver flex-shrink-0" />
                <span>Automatic 7-day rolling decline detection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-caregiver flex-shrink-0" />
                <span>Full CRUD for Reminders, Facts, Memories & Photos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-caregiver flex-shrink-0" />
                <span>Weekly Digest HTML Email preview & dispatch</span>
              </li>
            </ul>
          </div>

          <button
            data-testid="landing-caregiver-btn"
            onClick={onSelectCaregiver}
            className="touch-target-lg w-full py-4 bg-caregiver hover:bg-caregiver-secondary text-white font-black text-xl rounded-xl border-2 border-caregiver-primary flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Enter Caregiver Portal</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Demo Credentials Quick Evaluation Box */}
      <div className="max-w-4xl w-full mx-auto bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-950 mb-6">
        <div className="flex items-center gap-2 font-black text-sm mb-2 text-amber-900">
          <Key className="w-4 h-4 text-amber-700" />
          <span>PRE-SEEDED EVALUATION DEMO CREDENTIALS:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono font-semibold">
          <div className="bg-white p-2.5 rounded border border-amber-200">
            <span className="text-stone-500 font-sans font-bold block mb-0.5">Assamese Patient (DEMO01):</span>
            Code: <strong>DEMO01</strong> | PIN: <strong>1234</strong>
          </div>
          <div className="bg-white p-2.5 rounded border border-amber-200">
            <span className="text-stone-500 font-sans font-bold block mb-0.5">Demo Caregiver:</span>
            Email: <strong>caregiver@smriti.in</strong> | Password: <strong>Smriti@2026</strong>
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center border-t border-stone-300 pt-4 pb-2">
        <p className="text-xs font-bold text-stone-600">
          Smriti Dementia Care Platform • Ministry of Development of North Eastern Region (MDoNER / SIH26003)
        </p>
        <p className="text-xs font-semibold text-stone-500 mt-1">
          Demo data — not for clinical use.
        </p>
      </footer>
    </div>
  );
}

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { OfflineProvider } from "./context/OfflineContext";

import LandingPage from "./pages/LandingPage";
import PatientLoginPage from "./pages/PatientLoginPage";
import CaregiverLoginPage from "./pages/CaregiverLoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";

function AppContent() {
  const { user, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null); // null (landing), "patient", "caregiver"

  if (loading) {
    return (
      <div className="min-h-screen bg-patient-bg flex flex-col items-center justify-center p-4">
        <div className="text-4xl font-black text-red-700 mb-2 animate-pulse">স্মৃতি • Smriti</div>
        <p className="text-stone-600 font-bold text-sm">Loading dementia care workspace...</p>
      </div>
    );
  }

  // If user is already authenticated
  if (user) {
    if (user.role === "caregiver") {
      return <CaregiverDashboard onSwitchToPatient={() => setSelectedRole("patient")} />;
    } else if (user.role === "patient") {
      return <PatientDashboard />;
    }
  }

  // Not authenticated: Route based on selectedRole
  if (selectedRole === "patient") {
    return (
      <PatientLoginPage
        onSwitchToCaregiver={() => setSelectedRole("caregiver")}
        onBackToLanding={() => setSelectedRole(null)}
      />
    );
  }

  if (selectedRole === "caregiver") {
    return (
      <CaregiverLoginPage
        onSwitchToPatient={() => setSelectedRole("patient")}
        onBackToLanding={() => setSelectedRole(null)}
      />
    );
  }

  // Landing Page by default
  return (
    <LandingPage
      onSelectPatient={() => setSelectedRole("patient")}
      onSelectCaregiver={() => setSelectedRole("caregiver")}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <OfflineProvider>
          <AppContent />
        </OfflineProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

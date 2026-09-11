import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("smriti_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate session on load
    const token = localStorage.getItem("smriti_token");
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem("smriti_user", JSON.stringify(userData));
        })
        .catch(() => {
          // Keep local user state if offline, otherwise logout
          if (navigator.onLine) {
            // session invalid
            setUser(null);
            localStorage.removeItem("smriti_user");
            localStorage.removeItem("smriti_token");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginCaregiver = async (credentials) => {
    const data = await api.loginCaregiver(credentials);
    if (data.access_token) {
      localStorage.setItem("smriti_token", data.access_token);
      localStorage.setItem("smriti_user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const registerCaregiver = async (details) => {
    const data = await api.registerCaregiver(details);
    if (data.access_token) {
      localStorage.setItem("smriti_token", data.access_token);
      localStorage.setItem("smriti_user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const loginPatient = async (credentials) => {
    const data = await api.loginPatient(credentials);
    if (data.access_token) {
      localStorage.setItem("smriti_token", data.access_token);
      localStorage.setItem("smriti_user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    localStorage.removeItem("smriti_token");
    localStorage.removeItem("smriti_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginCaregiver, registerCaregiver, loginPatient, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

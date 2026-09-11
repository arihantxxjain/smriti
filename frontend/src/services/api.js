/**
 * Central API Client for Smriti
 * Supports Bearer token + httpOnly cookie credentials
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("smriti_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type to allow browser multipart boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include" // for httpOnly cookie
    });

    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      // Attempt token refresh
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            localStorage.setItem("smriti_token", refreshData.access_token);
            // Retry original request
            headers["Authorization"] = `Bearer ${refreshData.access_token}`;
            const retryRes = await fetch(url, { ...options, headers, credentials: "include" });
            return await handleResponse(retryRes);
          }
        }
      } catch (refreshErr) {
        console.warn("Refresh attempt failed:", refreshErr);
      }
    }

    return await handleResponse(response);
  } catch (error) {
    console.error(`API request error on ${endpoint}:`, error);
    throw error;
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (typeof data === "object" && data?.detail) 
      ? data.detail 
      : (typeof data === "string" ? data : `Request failed with status ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  loginCaregiver: (data) => apiRequest("/auth/caregiver/login", { method: "POST", body: JSON.stringify(data) }),
  registerCaregiver: (data) => apiRequest("/auth/caregiver/register", { method: "POST", body: JSON.stringify(data) }),
  loginPatient: (data) => apiRequest("/auth/patient/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => apiRequest("/auth/me"),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),

  // Patients & Caregivers
  getPatients: () => apiRequest("/patients"),
  getPatient: (id) => apiRequest(`/patients/${id}`),
  createPatient: (data) => apiRequest("/patients", { method: "POST", body: JSON.stringify(data) }),
  resetPatientPin: (id, newPin) => apiRequest(`/patients/${id}/reset-pin`, { method: "POST", body: JSON.stringify({ new_pin: newPin }) }),
  updateGeofence: (id, data) => apiRequest(`/patients/${id}/geofence`, { method: "PUT", body: JSON.stringify(data) }),

  // Surveys
  getSurvey: (patientId) => apiRequest(`/surveys/${patientId}`),
  updateSurvey: (patientId, data) => apiRequest(`/surveys/${patientId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Games
  getGameConfig: (patientId, gameType, difficulty = "medium") => apiRequest(`/games/config/${patientId}/${gameType}?difficulty=${difficulty}`),
  submitGame: (data) => apiRequest("/games/submit", { method: "POST", body: JSON.stringify(data) }),
  getGameSessions: (patientId) => apiRequest(`/games/sessions/${patientId}`),

  // Reminders
  getReminders: (patientId) => apiRequest(`/reminders/${patientId}`),
  createReminder: (data) => apiRequest("/reminders", { method: "POST", body: JSON.stringify(data) }),
  toggleReminder: (id, dateStr, completed) => apiRequest(`/reminders/${id}/toggle`, { method: "PUT", body: JSON.stringify({ date_str: dateStr, completed }) }),
  deleteReminder: (id) => apiRequest(`/reminders/${id}`, { method: "DELETE" }),
  syncReminders: (actions) => apiRequest("/reminders/sync", { method: "POST", body: JSON.stringify(actions) }),

  // Memories & Facts
  getMemories: (patientId) => apiRequest(`/memories/${patientId}`),
  createMemory: (patientId, data) => apiRequest(`/memories/${patientId}`, { method: "POST", body: JSON.stringify(data) }),
  deleteMemory: (id) => apiRequest(`/memories/${id}`, { method: "DELETE" }),
  getFacts: (patientId) => apiRequest(`/facts/${patientId}`),
  createFact: (patientId, data) => apiRequest(`/facts/${patientId}`, { method: "POST", body: JSON.stringify(data) }),
  deleteFact: (id) => apiRequest(`/facts/${id}`, { method: "DELETE" }),

  // Alerts & SOS
  triggerSOS: (data) => apiRequest("/alerts/sos", { method: "POST", body: JSON.stringify(data) }),
  triggerGeofenceAlert: (data) => apiRequest("/alerts/geofence", { method: "POST", body: JSON.stringify(data) }),
  getAlerts: (patientId) => apiRequest(`/alerts/patient/${patientId}`),
  updateAlert: (alertId, data) => apiRequest(`/alerts/${alertId}`, { method: "PUT", body: JSON.stringify(data) }),

  // Sathi
  chatSathi: (data) => apiRequest("/sathi/chat", { method: "POST", body: JSON.stringify(data) }),

  // Digest
  previewDigest: (patientId) => apiRequest(`/digest/preview/${patientId}`),
  sendDigest: (patientId) => apiRequest(`/digest/send/${patientId}`, { method: "POST" }),

  // Upload
  uploadFile: (formData) => apiRequest("/upload", { method: "POST", body: formData })
};

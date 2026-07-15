// TechMart AI Support — API Service Layer
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Token Management
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("techmart_token") : null;

const setToken = (token) => localStorage.setItem("techmart_token", token);

const clearToken = () => localStorage.removeItem("techmart_token");

// Base Fetch
async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

    ...options.headers,
  };

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,

      headers,

      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      clearToken();

      if (typeof window !== "undefined") window.location.href = "/login";

      throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Request failed");
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. The AI is taking too long. Please try again.",
      );
    }

    throw err;
  }
}

// Auth API
export const authAPI = {
  async register(name, email, password, phone = null) {
    const data = await apiFetch("/auth/register", {
      method: "POST",

      body: JSON.stringify({ name, email, password, phone }),
    });

    setToken(data.access_token);

    return data;
  },

  async login(email, password) {
    const data = await apiFetch("/auth/login", {
      method: "POST",

      body: JSON.stringify({ email, password }),
    });

    setToken(data.access_token);

    return data;
  },

  async getMe() {
    return apiFetch("/auth/me");
  },

  logout() {
    clearToken();

    if (typeof window !== "undefined") window.location.href = "/login";
  },

  isLoggedIn() {
    return !!getToken();
  },
};

// Sessions API
export const sessionsAPI = {
  async list() {
    return apiFetch("/sessions");
  },

  async create() {
    return apiFetch("/sessions", { method: "POST" });
  },

  async delete(sessionId) {
    return apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });
  },

  async deleteAll() {
    return apiFetch("/sessions", { method: "DELETE" });
  },

  async archive(sessionId) {
    return apiFetch(`/sessions/${sessionId}/archive`, { method: "POST" });
  },

  async archiveAll() {
    return apiFetch("/sessions/archive-all", { method: "POST" });
  },

  async getHistory(sessionId) {
    return apiFetch(`/sessions/${sessionId}/history`);
  },

  async getSummary(sessionId) {
    return apiFetch(`/sessions/${sessionId}/summary`);
  },
};

// Chat API
export const chatAPI = {
  async sendMessage(message, sessionId = null) {
    return apiFetch("/chat", {
      method: "POST",

      body: JSON.stringify({ message, session_id: sessionId }),
    });
  },
};

// Feedback API
export const feedbackAPI = {
  async submit(sessionId, rating, comment = null, messageId = null) {
    return apiFetch("/feedback", {
      method: "POST",

      body: JSON.stringify({
        session_id: sessionId,

        rating,

        comment,

        message_id: messageId,
      }),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  async get(days = 30) {
    return apiFetch(`/analytics?days=${days}`);
  },
};

// Admin API
export const adminAPI = {
  async listKBDocs() {
    return apiFetch("/admin/knowledge-base");
  },

  async rebuildIndex() {
    return apiFetch("/admin/knowledge-base/rebuild", { method: "POST" });
  },
};

// Health
export const systemAPI = {
  async health() {
    return apiFetch("/health");
  },
};

export default {
  authAPI,
  sessionsAPI,
  chatAPI,
  feedbackAPI,
  analyticsAPI,
  adminAPI,
  systemAPI,
};

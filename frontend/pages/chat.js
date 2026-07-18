
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  chatAPI,
  sessionsAPI,
  feedbackAPI,
  authAPI,
  analyticsAPI,
} from "../services/api";


function highlightMatch(text, query) {
  if (!query) return text;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());

  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}

      <mark
        style={{
          background: "#2563EB",
          color: "white",
          borderRadius: "2px",
          padding: "0 2px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>

      {text.slice(idx + query.length)}
    </>
  );
}


const AGENT_META = {
  billing: {
    label: "Billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
        />

        <rect x="2" y="9" width="20" height="2" fill="#2563EB" />

        <rect x="5" y="14" width="5" height="2" rx="1" fill="#2563EB" />
      </svg>
    ),
    color: "agent-billing",
  },

  technical: {
    label: "Technical",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M14.7 6.3a4 4 0 0 1-5.4 5.4l-5.6 5.6a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a4 4 0 0 1 5.4-5.4l-2.3 2.3-1.4-1.4z"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "agent-technical",
  },

  product: {
    label: "Product",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M21 8l-9-5-9 5 9 5 9-5z"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <path
          d="M3 8v8l9 5 9-5V8"
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <path d="M12 13v8" stroke="#2563EB" strokeWidth="1.5" />
      </svg>
    ),
    color: "agent-product",
  },

  complaint: {
    label: "Relations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M18 8a6 6 0 1 0-12 0c0 4-2 5-2 5h16s-2-1-2-5"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <path
          d="M9 17a3 3 0 0 0 6 0"
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.5"
        />
      </svg>
    ),
    color: "agent-complaint",
  },

  faq: {
    label: "Support",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.5A8 8 0 0 1 21 12z"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <path
          d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 1.6-2.4 3.3"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        <circle cx="12" cy="16.5" r="0.9" fill="#2563EB" />
      </svg>
    ),
    color: "agent-faq",
  },

  general: {
    label: "General",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24">
        <rect
          x="4"
          y="8"
          width="16"
          height="12"
          rx="2"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth="1.5"
        />

        <circle cx="9" cy="14" r="1.3" fill="#2563EB" />

        <circle cx="15" cy="14" r="1.3" fill="#2563EB" />

        <path d="M12 4v4" stroke="#2563EB" strokeWidth="1.5" />

        <circle cx="12" cy="3" r="1.2" fill="#2563EB" />
      </svg>
    ),
    color: "agent-general",
  },
};

const SENTIMENT_ICON = {
  positive: (
    <svg width="30" height="30" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="white"
        stroke="green"
        strokeWidth="1.5"
      />

      <circle cx="9" cy="10" r="1" fill="green" />

      <circle cx="15" cy="10" r="1" fill="green" />

      <path
        d="M8 14a4 4 0 0 0 8 0"
        stroke="green"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),

  neutral: (
    <svg width="30" height="30" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="white"
        stroke="blue"
        strokeWidth="1.5"
      />

      <circle cx="9" cy="10" r="1" fill="blue" />

      <circle cx="15" cy="10" r="1" fill="blue" />

      <path d="M8 15h8" stroke="blue" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  negative: (
    <svg width="30" height="30" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="white"
        stroke="red"
        strokeWidth="1.5"
      />

      <circle cx="9" cy="10" r="1" fill="red" />

      <circle cx="15" cy="10" r="1" fill="red" />

      <path
        d="M8 16a4 4 0 0 1 8 0"
        stroke="red"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),

  frustrated: (
    <svg width="30" height="30" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="white"
        stroke="orange"
        strokeWidth="1.5"
      />

      <path
        d="M7.5 9.5l3 1M16.5 9.5l-3 1"
        stroke="orange"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M8 16a4 4 0 0 1 8 0"
        stroke="orange"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  ),
};


function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-5 message-enter">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        TM
      </div>

      <div className="message-assistant flex items-center gap-1 py-4 px-5">
        <span className="typing-dot" />

        <span className="typing-dot" />

        <span className="typing-dot" />
      </div>
    </div>
  );
}

function AgentBadge({ agent }) {
  const meta = AGENT_META[agent] || AGENT_META.general;

  return (
    <span className={`agent-badge ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 mb-5 message-enter ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isUser ? "bg-blue-600 text-white" : "bg-gradient-to-br from-blue-500 to-blue-700 text-white"}`}
      >
        {isUser ? "ME" : "TM"}
      </div>

      <div className="flex flex-col gap-1 max-w-[80%]">
        {isUser ? (
          <div className="flex flex-col gap-2">
            {}
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {message.files.map((f, i) => (
                  <div
                    key={i}
                    className="bg-blue-700 rounded-xl overflow-hidden"
                  >
                    {f.url ? (
                      <img
                        src={f.url}
                        alt={f.name}
                        className="max-w-[200px] max-h-[150px] object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="text-lg">
                          {f.type === "application/pdf"
                            ? "📄"
                            : f.type.includes("word")
                              ? "📝"
                              : "📎"}
                        </span>

                        <div>
                          <div className="text-xs font-medium text-white truncate max-w-[150px]">
                            {f.name}
                          </div>

                          <div className="text-[10px] text-blue-200">
                            {(f.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {message.content && (
              <div className="message-user">{message.content}</div>
            )}
          </div>
        ) : (
          <>
            <div className="message-assistant whitespace-pre-wrap">
              {message.content}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {message.agent && <AgentBadge agent={message.agent} />}

              {message.sentiment && message.sentiment !== "neutral" && (
                <span className={`text-xs sentiment-${message.sentiment}`}>
                  {SENTIMENT_ICON[message.sentiment]} {message.sentiment}
                </span>
              )}

              {message.response_time_ms > 0 && (
                <span className="text-xs text-slate-400">
                  {Math.round(message.response_time_ms)}ms
                </span>
              )}
            </div>
          </>
        )}

        <div className="text-xs text-slate-400 px-1">
          {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ sessionId, onClose }) {
  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState("");

  const [hover, setHover] = useState(0);

  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!rating) return;

    await feedbackAPI.submit(sessionId, rating, comment || null);

    setSubmitted(true);

    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 fade-in">
      <div className="card p-6 w-full max-w-md mx-4">
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🙏</div>

            <p className="font-semibold text-lg">
              Thank you for your feedback!
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-1">
              Rate this conversation
            </h3>

            <p className="text-slate-500 text-sm mb-4">
              How helpful was our support today?
            </p>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="star-btn"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                >
                  {star <= (hover || rating) ? "⭐" : "☆"}
                </button>
              ))}
            </div>

            <textarea
              className="auth-input resize-none mb-4"
              rows={3}
              placeholder="Additional comments (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={submit}
                disabled={!rating}
              >
                Submit Feedback
              </button>

              <button
                className="flex-1 border border-slate-200 rounded-xl py-2 text-sm font-medium hover:bg-slate-50"
                onClick={onClose}
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  sessions,

  currentSessionId,

  onSelectSession,

  onNewSession,

  onDeleteSession,

  user,

  onShowAnalytics,

  sidebarOpen,

  searchQuery,

  setSearchQuery,

  filteredSessions,

  sidebarCollapsed,

  onDeleteAll,

  onArchiveAll,

  darkMode,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [activeView, setActiveView] = useState("chats");
  const [expandedSection, setExpandedSection] = useState(null);
  const menuRef = useRef(null);

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setExpandedSection(null);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <aside
      className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}
      style={{
        background: "#ffffff",
        borderRight: "2px solid #EAE7DE",
      }}
    >
      {}
      <div
        style={{
          padding: "13.2px",

          borderBottom: "2px solid #EAE7DE",

          display: "flex",

          alignItems: "center",

          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 32,

              height: 32,

              borderRadius: 10,

              background: "linear-gradient(135deg, #1A1A1A, #1A1A1A)",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontWeight: 800,

              fontSize: 16,

              color: "#F7F5F0",

              flexShrink: 0,
            }}
          >
            T
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A" }}>
              TechMart AI
            </div>

            <div style={{ fontSize: 11, color: "#8A8578" }}>
              Customer Support
            </div>
          </div>
        </div>
      </div>

      {}
      <div style={{ padding: "0px 15px 4px" }}>
        <button
          onClick={onNewSession}
          style={{
            width: "100%",

            display: "flex",

            alignItems: "center",

            gap: 8,

            background: "#EAE7DE",

            color: "#1A1A1A",

            border: "none",

            borderRadius: 8,

            padding: "9px 15px",

            fontSize: 13,

            fontWeight: 600,

            cursor: "pointer",

            transition: "background 0.15s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.08)";
            e.currentTarget.style.paddingLeft = "4px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.paddingLeft = "0px";
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: darkMode ? "#1E293B" : "rgba(0,0,0,0.06)",
              border: darkMode ? "1px solid #334155" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />

              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          New Chat
        </button>
      </div>

      {}
      {}
      <div style={{ padding: "0px 19px 4px" }}>
        <button
          onClick={() => setActiveView("chats")}
          className={`sidebar-item ${activeView === "chats" ? "active" : ""}`}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            textAlign: "left",
            color: "#1A1A1A",
            transition: "background 0.15s, padding-left 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.08)";
            e.currentTarget.style.paddingLeft = "4px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.paddingLeft = "0px";
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>

          <span style={{ fontSize: 13 }}>Chats</span>
        </button>
      </div>

      {}
      <div style={{ padding: "0px 19px 4px" }}>
        <button
          onClick={() => {
            setActiveView("analytics");
            onShowAnalytics();
          }}
          className={`sidebar-item ${activeView === "analytics" ? "active" : ""}`}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            textAlign: "left",
            color: "#1A1A1A",
            transition: "background 0.15s, padding-left 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.08)";
            e.currentTarget.style.paddingLeft = "4px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.paddingLeft = "0px";
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />

            <line x1="12" y1="20" x2="12" y2="4" />

            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>

          <span style={{ fontSize: 13 }}>Analytics</span>
        </button>
      </div>

      {}
      <div style={{ padding: "20px 6px 4px" }}></div>
      {activeView === "chats" && (
        <div
          style={{
            flex: 1,

            overflow: "hidden",

            display: "flex",

            flexDirection: "column",

            padding: "0 12px",
          }}
        >
          {}

          <div style={{ position: "relative", marginBottom: 20 }}>
            <svg
              style={{
                position: "absolute",

                left: 9,

                top: "50%",

                transform: "translateY(-50%)",

                color: "#8A8578",

                pointerEvents: "none",
              }}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />

              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              placeholder="Search Chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{
                paddingLeft: 28,
                color: "#1A1A1A",
                background: "#EFEDE5",
                border: "1px solid transparent",
                outline: "none",
                borderRadius: 6,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.background = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "#EFEDE5";
              }}
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",

                  right: 8,

                  top: "50%",

                  transform: "translateY(-50%)",

                  background: "#C9C2B4",

                  border: "none",

                  color: "#1A1A1A",

                  cursor: "pointer",

                  padding: 0,

                  fontSize: 11,

                  borderRadius: "50%",

                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#B8B0A0")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#C9C2B4")
                }
              >
                ✕
              </button>
            )}
          </div>

          {}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 4px",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#8A8578",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                flex: 1,
              }}
            >
              {searchQuery ? `Results (${filteredSessions.length})` : "Recents"}
            </div>
            {filteredSessions.length > 0 && !searchQuery && (
              <div style={{ display: "flex", gap: 4 }}>
                {}
                <button
                  title="Archive all chats"
                  onClick={async () => {
                    if (window.confirm("Archive all conversations?")) {
                      await sessionsAPI.archiveAll();
                      onArchiveAll();
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#8A8578",
                    padding: "2px 4px",
                    borderRadius: 4,
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#1A1A1A";
                    e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8A8578";
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
                {}
                <button
                  title="Delete all chats"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Delete ALL conversations? This cannot be undone.",
                      )
                    ) {
                      await sessionsAPI.deleteAll();
                      onDeleteAll();
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#8A8578",
                    padding: "2px 4px",
                    borderRadius: 4,
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#EF4444";
                    e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8A8578";
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredSessions.length === 0 && (
              <div
                style={{ fontSize: 12, color: "#A8A297", padding: "8px 4px" }}
              >
                {searchQuery ? "No results found" : "No conversations yet"}
              </div>
            )}

            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`sidebar-item group ${s.id === currentSessionId ? "active" : ""}`}
                onClick={() => onSelectSession(s.id)}
                style={{
                  marginBottom: 1,
                  color: "#1A1A1A",
                  borderRadius: 6,
                  transition: "background 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.08)";
                  e.currentTarget.style.transform = "translateX(2px)";
                  const delBtns =
                    e.currentTarget.querySelectorAll(".delete-btn");
                  delBtns.forEach((b) => (b.style.opacity = "1"));
                }}
                onMouseLeave={(e) => {
                  if (s.id !== currentSessionId) {
                    e.currentTarget.style.background = "transparent";
                  }
                  e.currentTarget.style.transform = "translateX(0)";
                  const delBtns =
                    e.currentTarget.querySelectorAll(".delete-btn");
                  delBtns.forEach((b) => (b.style.opacity = "0"));
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,

                      overflow: "hidden",

                      textOverflow: "ellipsis",

                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.title || "New Chat"}
                  </div>

                  <div style={{ fontSize: 10, color: "#A8A297", marginTop: 1 }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>

                <button
                  className="delete-btn"
                  title="Archive"
                  style={{
                    opacity: 0,
                    color: "#1A1A1A",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 2px",
                    flexShrink: 0,
                    transition: "opacity 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#F59E0B")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#1A1A1A")
                  }
                  onClick={async (e) => {
                    e.stopPropagation();
                    await sessionsAPI.archive(s.id);
                    onDeleteSession(s.id);
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                  </svg>
                </button>

                <button
                  className="delete-btn"
                  title="Delete"
                  style={{
                    opacity: 0,

                    fontSize: 10,

                    color: "#1A1A1A",

                    background: "none",

                    border: "none",

                    cursor: "pointer",

                    padding: "0 2px",

                    flexShrink: 0,

                    transition: "opacity 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#EF4444")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#1A1A1A")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />

                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />

                    <line x1="10" y1="11" x2="10" y2="17" />

                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {activeView === "analytics" && <div style={{ flex: 1 }} />}

      {}

      <div
        ref={menuRef}
        style={{
          padding: "10px 12px",

          borderTop: "2px solid #EAE7DE",

          position: "relative",
        }}
      >
        {}

        {showMenu && (
          <div
            style={{
              position: "absolute",

              bottom: "calc(100% + 8px)",

              left: 12,

              right: 12,

              background: darkMode ? "#111827" : "#FFFFFF",

              border: darkMode
                ? "1px solid #334155"
                : "1px solid rgba(0,0,0,0.1)",

              borderRadius: 12,

              overflow: "hidden",

              boxShadow: darkMode
                ? "0 -8px 32px rgba(0,0,0,0.45)"
                : "0 -8px 32px rgba(0,0,0,0.12)",

              zIndex: 100,
            }}
          >
            {}
            <div
              style={{
                padding: "12px 14px",

                borderBottom: darkMode
                  ? "1px solid #334155"
                  : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: darkMode ? "#94A3B8" : "#8A8578",
                  marginBottom: 2,
                }}
              >
                Signed in as
              </div>

              <div
                style={{
                  fontSize: 12,

                  color: darkMode ? "#F8FAFC" : "#1A1A1A",

                  fontWeight: 500,

                  overflow: "hidden",

                  textOverflow: "ellipsis",

                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </div>
            </div>

            {}
            <div>
              <button
                onClick={() => toggleSection("settings")}
                style={{
                  width: "100%",

                  display: "flex",

                  alignItems: "center",

                  gap: 10,

                  padding: "10px 14px",

                  background:
                    expandedSection === "settings"
                      ? "rgba(59,130,246,0.08)"
                      : "none",

                  border: "none",

                  color: expandedSection === "settings" ? "#2563EB" : "#5C5849",

                  fontSize: 13,

                  cursor: "pointer",

                  textAlign: "left",

                  borderBottom: "1px solid rgba(0,0,0,0.05)",

                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.color = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    expandedSection === "settings"
                      ? "rgba(59,130,246,0.08)"
                      : "none";
                  e.currentTarget.style.color =
                    expandedSection === "settings" ? "#2563EB" : "#5C5849";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />

                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>

                <span style={{ flex: 1 }}>Settings</span>

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      expandedSection === "settings"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {}
              {expandedSection === "settings" && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {[
                    {
                      label: "Account & Profile",
                      action: () =>
                        alert(
                          `👤 Account\n\nName: ${user?.name}\nEmail: ${user?.email}\nRole: ${user?.is_admin ? "Admin" : "User"}\nMember since: ${new Date(user?.created_at || Date.now()).toLocaleDateString()}`,
                        ),
                    },

                    {
                      label: "Notifications",
                      action: () =>
                        alert(
                          "🔔 Notifications\n\n✅ Email alerts: Enabled\n✅ Chat summaries: Enabled\n❌ SMS alerts: Disabled\n\nContact support to change notification settings.",
                        ),
                    },

                    {
                      label: "Privacy & Security",
                      action: () =>
                        alert(
                          "🔒 Privacy & Security\n\n✅ Data encrypted (256-bit SSL)\n✅ PCI-DSS Level 1 certified\n✅ No data sold to third parties\n\nView full policy: techmartelectronics.com/privacy",
                        ),
                    },

                    {
                      label: "Change Password",
                      action: () =>
                        alert(
                          "🔑 Change Password\n\nTo change your password, contact:\nsupport@techmartelectronics.com\n\nOr call: 1-800-TECHMART",
                        ),
                    },
                  ].map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => {
                        sub.action();
                      }}
                      style={{
                        width: "100%",

                        display: "flex",

                        alignItems: "center",

                        gap: 8,

                        padding: "8px 14px 8px 36px",

                        background: "none",

                        border: "none",

                        color: "#8A8578",

                        fontSize: 12,

                        cursor: "pointer",

                        textAlign: "left",

                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8A8578")
                      }
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>

                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {}
            <div>
              <button
                onClick={() => toggleSection("language")}
                style={{
                  width: "100%",

                  display: "flex",

                  alignItems: "center",

                  gap: 10,

                  padding: "10px 14px",

                  background:
                    expandedSection === "language"
                      ? "rgba(59,130,246,0.08)"
                      : "none",

                  border: "none",

                  color: expandedSection === "language" ? "#2563EB" : "#5C5849",

                  fontSize: 13,

                  cursor: "pointer",

                  textAlign: "left",

                  borderBottom: "1px solid rgba(0,0,0,0.05)",

                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.color = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    expandedSection === "language"
                      ? "rgba(59,130,246,0.08)"
                      : "none";
                  e.currentTarget.style.color =
                    expandedSection === "language" ? "#2563EB" : "#5C5849";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />

                  <line x1="2" y1="12" x2="22" y2="12" />

                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>

                <span style={{ flex: 1 }}>Language</span>

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      expandedSection === "language"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {}
              {expandedSection === "language" && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {[
                    {
                      label: "🇺🇸  English",
                      action: () => alert("✅ Language set to English"),
                    },

                    {
                      label: "🇮🇳  Hindi",
                      action: () =>
                        alert(
                          "✅ Language set to Hindi\nFull Hindi support coming soon.",
                        ),
                    },

                    {
                      label: "🇪🇸  Spanish",
                      action: () =>
                        alert(
                          "✅ Language set to Spanish\nFull Spanish support coming soon.",
                        ),
                    },

                    {
                      label: "🇫🇷  French",
                      action: () =>
                        alert(
                          "✅ Language set to French\nFull French support coming soon.",
                        ),
                    },

                    {
                      label: "🇩🇪  German",
                      action: () =>
                        alert(
                          "✅ Language set to German\nFull German support coming soon.",
                        ),
                    },

                    {
                      label: "🇯🇵  Japanese",
                      action: () =>
                        alert(
                          "✅ Language set to Japanese\nFull Japanese support coming soon.",
                        ),
                    },
                  ].map((lang) => (
                    <button
                      key={lang.label}
                      onClick={() => {
                        lang.action();
                      }}
                      style={{
                        width: "100%",

                        display: "flex",

                        alignItems: "center",

                        gap: 8,

                        padding: "8px 14px 8px 36px",

                        background: "none",

                        border: "none",

                        color: "#8A8578",

                        fontSize: 12,

                        cursor: "pointer",

                        textAlign: "left",

                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8A8578")
                      }
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {}
            <div>
              <button
                onClick={() => toggleSection("help")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background:
                    expandedSection === "help"
                      ? "rgba(59,130,246,0.08)"
                      : "none",
                  border: "none",
                  color: expandedSection === "help" ? "#2563EB" : "#5C5849",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.color = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    expandedSection === "help"
                      ? "rgba(59,130,246,0.08)"
                      : "none";
                  e.currentTarget.style.color =
                    expandedSection === "help" ? "#2563EB" : "#5C5849";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>

                <span style={{ flex: 1 }}>Get Help</span>

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      expandedSection === "help"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSection === "help" && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {[
                    {
                      label: "Email Support",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M22 6l-10 7L2 6" />
                        </svg>
                      ),
                      action: () =>
                        window.open(
                          "mailto:support@techmartelectronics.com?subject=Help Request",
                        ),
                    },
                    {
                      label: "Call 1-800-TECHMART",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                        </svg>
                      ),
                      action: () => window.open("tel:18008324627"),
                    },
                    {
                      label: "Live Chat",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      ),
                      action: () =>
                        window.open("https://www.techmartelectronics.com/chat"),
                    },
                    {
                      label: "Documentation",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      ),
                      action: () =>
                        window.open(
                          "https://www.techmartelectronics.com/support",
                        ),
                    },
                    {
                      label: "Report a Bug",
                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="8" y="6" width="8" height="14" rx="4" />
                          <path d="M19 7l-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M12 6V3M8 3h8M3 13h5M16 13h5" />
                        </svg>
                      ),
                      action: () =>
                        window.open(
                          "mailto:bugs@techmartelectronics.com?subject=Bug Report",
                        ),
                    },
                  ].map((help) => (
                    <button
                      key={help.label}
                      onClick={() => {
                        help.action();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px 8px 36px",
                        background: "none",
                        border: "none",
                        color: "#8A8578",
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8A8578")
                      }
                    >
                      {help.icon}
                      {help.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {}
            <div>
              <button
                onClick={() => toggleSection("upgrade")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background:
                    expandedSection === "upgrade"
                      ? "rgba(59,130,246,0.08)"
                      : "none",
                  border: "none",
                  color: expandedSection === "upgrade" ? "#2563EB" : "#5C5849",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.color = "#1A1A1A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    expandedSection === "upgrade"
                      ? "rgba(59,130,246,0.08)"
                      : "none";
                  e.currentTarget.style.color =
                    expandedSection === "upgrade" ? "#2563EB" : "#5C5849";
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>

                <span style={{ flex: 1 }}>Upgrade Plan</span>

                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      expandedSection === "upgrade"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedSection === "upgrade" && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {[
                    {
                      label: "Free (Basic) — ₹0 ($0)",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="8" width="18" height="13" rx="1" />
                          <path d="M12 8v13" />
                          <path d="M3 12h18" />
                          <path d="M12 8c-1.5-3-3.5-4-5-3-1 .7-.8 2.5 1 3" />
                          <path d="M12 8c1.5-3 3.5-4 5-3 1 .7.8 2.5-1 3" />
                        </svg>
                      ),

                      action: () =>
                        alert(
                          "TechMart Care Free\n₹0/month · $0/month\n\n✅ 1 year warranty\n✅ Standard support (48hr)\n✅ Email support only\n\nUpgrade anytime from this menu.",
                        ),
                    },

                    {
                      label: "Plus — ₹199/month ($2.09)",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ),

                      action: () =>
                        alert(
                          "TechMart Care Plus\n₹199/month · $2.09/month\n\n✅ 2 year warranty\n✅ Priority support (24hr)\n✅ Free standard repair shipping\n✅ Double Rewards points\n\nContact: billing@techmartelectronics.com",
                        ),
                    },

                    {
                      label: "Pro — ₹999/month ($10.48)",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                        </svg>
                      ),

                      action: () =>
                        alert(
                          "TechMart Care Pro\n₹999/month · $10.48/month\n\n✅ 3 year warranty\n✅ Accidental damage cover (2x/year)\n✅ 4-hour support response\n✅ Free express repair shipping\n✅ Free battery replacement\n\nContact: billing@techmartelectronics.com",
                        ),
                    },

                    {
                      label: "Max — ₹1999/month ($20.97)",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8L12 2z" />
                          <path d="M6 20h12" />
                        </svg>
                      ),

                      action: () =>
                        alert(
                          "TechMart Care Max\n₹1999/month · $20.97/month\n\n✅ All Pro features\n✅ Same-day support response\n✅ Free annual device checkup\n✅ Extended accidental damage cover (4x/year)\n✅ Priority express shipping\n\nContact: billing@techmartelectronics.com",
                        ),
                    },

                    {
                      label: "Business — ₹2999/month ($31.46)",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="4" y="8" width="16" height="13" rx="1" />
                          <path d="M9 21V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v13" />
                          <path d="M9 3h6l1 4H8l1-4z" />
                        </svg>
                      ),

                      action: () =>
                        alert(
                          "TechMart Care Business\n₹2999/month · $31.46/month\n\n✅ All Max features\n✅ Dedicated account manager\n✅ 1-hour SLA\n✅ On-site repair (select cities)\n✅ Priority replacement\n\nContact: business@techmartelectronics.com",
                        ),
                    },

                    {
                      label: "Contact Sales",

                      icon: (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
                        </svg>
                      ),

                      action: () =>
                        window.open(
                          "mailto:sales@techmartelectronics.com?subject=Plan Upgrade Inquiry",
                        ),
                    },
                  ].map((plan) => (
                    <button
                      key={plan.label}
                      onClick={() => {
                        plan.action();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px 8px 36px",
                        background: "none",
                        border: "none",
                        color: "#8A8578",
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1A1A1A")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8A8578")
                      }
                    >
                      {plan.icon}

                      {plan.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {}
            <button
              onClick={() => authAPI.logout()}
              style={{
                width: "100%",

                display: "flex",

                alignItems: "center",

                gap: 10,

                padding: "10px 14px",

                background: "none",

                border: "none",

                color: "#EF4444",

                fontSize: 13,

                cursor: "pointer",

                textAlign: "left",

                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

                <polyline points="16 17 21 12 16 7" />

                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        )}

        {}
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          style={{
            width: "100%",

            display: "flex",

            alignItems: "center",

            gap: 10,

            background: showMenu ? "rgba(0,0,0,0.06)" : "none",

            border: "none",

            borderRadius: 8,

            padding: "8px 10px",

            cursor: "pointer",

            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.06)")
          }
          onMouseLeave={(e) => {
            if (!showMenu) e.currentTarget.style.background = "none";
          }}
        >
          {}

          <div
            style={{
              width: 30,

              height: 30,

              borderRadius: "50%",

              background: "linear-gradient(135deg, #1A1A1A, #1A1A1A)",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontSize: 12,

              fontWeight: 700,

              color: "#F7F5F0",

              flexShrink: 0,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>

          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div
              style={{
                fontSize: 13,

                fontWeight: 500,

                color: "#1A1A1A",

                overflow: "hidden",

                textOverflow: "ellipsis",

                whiteSpace: "nowrap",
              }}
            >
              {user?.name}
            </div>

            <div style={{ fontSize: 10, color: "#A8A297" }}>
              {user?.is_admin ? "Admin" : "Free plan"}
            </div>
          </div>

          {}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A8A297"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showMenu ? "rotate(180deg)" : "rotate(0deg)",

              transition: "transform 0.2s",

              flexShrink: 0,
            }}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

function AnalyticsPanel({ onClose }) {
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI
      .get(30)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-auto p-6 fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 24 24">
              <rect
                x="3"
                y="3"
                width="8"
                height="10"
                rx="1.5"
                fill="white"
                stroke="blue"
                strokeWidth="1.5"
              />

              <rect
                x="13"
                y="3"
                width="8"
                height="6"
                rx="1.5"
                fill="white"
                stroke="red"
                strokeWidth="1.5"
              />

              <rect
                x="13"
                y="11"
                width="8"
                height="10"
                rx="1.5"
                fill="white"
                stroke="green"
                strokeWidth="1.5"
              />

              <rect
                x="3"
                y="15"
                width="8"
                height="6"
                rx="1.5"
                fill="white"
                stroke="yellow"
                strokeWidth="1.5"
              />
            </svg>
            Analytics Dashboard
          </h2>

          <button className="btn-primary text-sm px-4 py-2" onClick={onClose}>
            ← Back to Chat
          </button>
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 text-center">
                  <div className="h-8 bg-slate-200 rounded mb-2 mx-auto w-16" />

                  <div className="h-4 bg-slate-100 rounded w-20 mx-auto" />
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="h-4 bg-slate-200 rounded w-32 mb-4" />

              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <div className="h-3 bg-slate-200 rounded w-20" />

                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full" />

                  <div className="h-3 bg-slate-200 rounded w-16" />
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="h-4 bg-slate-200 rounded w-40 mb-4" />

              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-slate-100 rounded w-24" />
                ))}
              </div>
            </div>
          </div>
        )}

        {data && (
          <>
            {}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Conversations",
                  value: data.total_conversations,
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path
                        d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1.2-4.3A8 8 0 1 1 21 12z"
                        fill="pink"
                        stroke="pink"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />

                      <circle cx="9" cy="12" r="1" fill="green" />

                      <circle cx="12" cy="12" r="1" fill="green" />

                      <circle cx="15" cy="12" r="1" fill="green" />
                    </svg>
                  ),
                },

                {
                  label: "Messages",
                  value: data.total_messages,
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="13"
                        rx="2"
                        fill="white"
                        stroke="red"
                        strokeWidth="1.5"
                      />

                      <path
                        d="M3 6l9 6 9-6"
                        fill="none"
                        stroke="red"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },

                {
                  label: "Avg Rating",
                  value: data.average_rating
                    ? `${data.average_rating.toFixed(1)}`
                    : "N/A",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path
                        d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"
                        fill="yellow"
                        stroke="yellow"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },

                {
                  label: "Avg Response",
                  value: `${Math.round(data.avg_response_time_ms)}ms`,
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path
                        d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
                        fill="white"
                        stroke="skyblue"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
              ].map((kpi) => (
                <div key={kpi.label} className="card p-4 text-center">
                  <div className="flex justify-center mb-1">{kpi.icon}</div>

                  <div className="text-2xl font-bold" style={{ color: "grey" }}>
                    {kpi.value}
                  </div>

                  <div className="text-xs text-white-500 mt-0.5">
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {}

            <div className="card p-4 mb-4">
              <h3 className="font-semibold mb-3">Agent Usage</h3>

              <div className="space-y-2">
                {data.agent_distribution.map((a) => (
                  <div key={a.agent} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-right text-white-600 capitalize">
                      {a.agent}
                    </div>

                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${a.percentage}%` }}
                      />
                    </div>

                    <div className="text-sm text-white-500 w-16 text-right">
                      {a.count} ({a.percentage}%)
                    </div>
                  </div>
                ))}

                {data.agent_distribution.length === 0 && (
                  <p className="text-slate-400 text-sm">No data yet</p>
                )}
              </div>
            </div>

            {}
            {data.intent_distribution &&
              data.intent_distribution.length > 0 && (
                <div className="card p-4 mb-4">
                  <h3 className="font-semibold mb-3">Intent Distribution</h3>

                  <div className="space-y-2">
                    {data.intent_distribution

                      .sort((a, b) => b.count - a.count)

                      .map((item) => {
                        const total =
                          data.intent_distribution.reduce(
                            (sum, x) => sum + x.count,
                            0,
                          ) || 1;

                        const pct = Math.round((item.count / total) * 100);

                        return (
                          <div
                            key={item.intent}
                            className="flex items-center gap-3"
                          >
                            <div className="w-24 text-sm text-right text-white-600 capitalize">
                              {item.intent}
                            </div>

                            <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                              <div
                                className="bg-purple-500 h-2.5 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="text-sm text-white-500 w-16 text-right">
                              {item.count} ({pct}%)
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {}

            <div className="card p-4 mb-4">
              <h3 className="font-semibold mb-3">Sentiment Distribution</h3>

              <div className="flex gap-4 flex-wrap">
                {data.sentiment_distribution.map((s) => (
                  <div key={s.sentiment} className="flex items-center gap-2">
                    <span className={`text-lg sentiment-${s.sentiment}`}>
                      {SENTIMENT_ICON[s.sentiment]}
                    </span>

                    <span className="capitalize text-sm text-white-700">
                      {s.sentiment}
                    </span>

                    <span className="text-sm font-semibold text-white-900">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {}

            {data.daily_conversations.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-3">
                  Daily Conversations (Last 7 days)
                </h3>

                <div className="flex items-end gap-2 h-40 pt-6">
                  {data.daily_conversations.map((d) => {
                    const max = Math.max(
                      ...data.daily_conversations.map((x) => x.count),
                      1,
                    );

                    const heightPx = Math.max((d.count / max) * 100, 20);

                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div className="text-xs font-semibold text-white-600 daily-chart-label mb-1">
                          {d.count}
                        </div>

                        <div
                          className="w-full bg-green-500 hover:bg-green-500 daily-chart-bar rounded-t transition-all"
                          style={{ height: `${heightPx}px` }}
                          title={`${d.date}: ${d.count} conversations`}
                        />

                        <div className="text-[10px] text-white-400 mt-1 text-center">
                          {d.date.slice(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default function ChatPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [sessions, setSessions] = useState([]);

  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [fontSize, setFontSize] = useState(14);

  
  const filteredSessions = sessions.filter((s) =>
    (s.title || "New Conversation")

      .toLowerCase()

      .includes(searchQuery.toLowerCase()),
  );

  const [isListening, setIsListening] = useState(false);

  const [attachedFiles, setAttachedFiles] = useState([]);

  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",

      "application/pdf",
      "text/plain",
      "text/csv",
    ];

    const maxSize = 10 * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Max 10MB.`);

        continue;
      }

      let fileContent = "";

      let previewUrl = null;

      try {
        if (file.type.startsWith("image/")) {
          

          previewUrl = URL.createObjectURL(file);

          fileContent = `[Image file: ${file.name}]`;
        } else if (file.type === "text/plain" || file.type === "text/csv") {
          

          fileContent = await new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);

            reader.readAsText(file);
          });
        } else if (file.type === "application/pdf") {
          

          fileContent = await new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
              try {
                
                const text = e.target.result;

                resolve(
                  `[PDF: ${file.name} - ${(file.size / 1024).toFixed(1)}KB]\n${text.substring(0, 3000)}`,
                );
              } catch {
                resolve(
                  `[PDF file: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB]`,
                );
              }
            };

            reader.readAsText(file);
          });
        } else {
          fileContent = `[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(1)}KB]`;
        }

        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,

            type: file.type,

            size: file.size,

            content: fileContent,

            previewUrl,
          },
        ]);
      } catch (err) {
        console.error("File read error:", err);

        alert(`Could not read ${file.name}`);
      }
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return "🖼️";

    if (file.type === "application/pdf") return "📄";

    if (file.type.includes("word")) return "📝";

    if (file.type === "text/csv") return "📊";

    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";

    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";

    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const startVoice = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice input only works in Google Chrome. Please use Chrome.");

      return;
    }

    if (isListening) {
      setIsListening(false);

      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";

      recognition.continuous = false;

      recognition.interimResults = false;

      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;

        setInput(transcript);

        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);

        if (event.error === "not-allowed") {
          alert(
            "Microphone blocked! Fix it:\n1. Click 🔒 in address bar\n2. Set Microphone → Allow\n3. Refresh page",
          );
        } else if (event.error === "no-speech") {
          alert("No speech detected. Please try again and speak clearly.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);

      alert("Voice error: " + err.message);
    }
  };

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("techmart_dark_mode");

    if (saved === "true") setDarkMode(true);
  }, []);

  const toggleDark = () => {
    setDarkMode((prev) => {
      localStorage.setItem("techmart_dark_mode", String(!prev));

      return !prev;
    });
  };

  const bottomRef = useRef(null);

  const inputRef = useRef(null);

  
  useEffect(() => {
    if (!authAPI.isLoggedIn()) {
      router.push("/login");
      return;
    }

    authAPI
      .getMe()
      .then(setUser)
      .catch(() => {
        authAPI.logout();
      });

    
    sessionsAPI
      .list()
      .then((data) => {
        setSessions(data);

        
      })
      .catch(console.error);
  }, []);

  
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("techmart_last_session", currentSessionId);
    }
  }, [currentSessionId]);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  
  useEffect(() => {
    if (!showAnalytics) {
      sessionsAPI.list().then(setSessions).catch(console.error);
    }
  }, [showAnalytics]);

  
  const loadSession = useCallback(
    async (sessionId) => {
      setCurrentSessionId(sessionId);

      setSidebarOpen(false);

      setShowAnalytics(false);

      try {
        const data = await sessionsAPI.getHistory(sessionId);

        setMessages(data.messages || []);
      } catch {
        setMessages([]);
      }
    },

    [],
  );

  const newSession = useCallback(async () => {
    const session = await sessionsAPI.create();

    setSessions((prev) => [session, ...prev]);

    setCurrentSessionId(session.id);

    setMessages([]);

    setShowAnalytics(false);

    setSidebarOpen(false);

    inputRef.current?.focus();
  }, []);

  const deleteSession = useCallback(
    async (sessionId) => {
      await sessionsAPI.delete(sessionId);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);

        setMessages([]);
      }
    },

    [currentSessionId],
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();

    if ((!text && attachedFiles.length === 0) || isTyping) return;

    
    const messageText =
      text ||
      (attachedFiles.length > 0 ? "Please analyze the attached file(s)." : "");

    if (!messageText) return;

    setInput("");

    const userMsg = {
      id: Date.now(),

      role: "user",

      content: messageText,
    };

    
    let fullMessage = messageText;

    if (attachedFiles.length > 0) {
      const fileContents = attachedFiles
        .map((f) => `--- File: ${f.name} ---\n${f.content || f.name}`)
        .join("\n\n");

      fullMessage = messageText
        ? `${messageText}\n\nAttached files:\n${fileContents}`
        : `Please analyze these attached files:\n\n${fileContents}`;
    }

    setAttachedFiles([]); 

    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);

    try {
      const res = await chatAPI.sendMessage(fullMessage, currentSessionId);

      if (!currentSessionId) {
        setCurrentSessionId(res.session_id);
      }

      
      const updatedSessions = await sessionsAPI.list();
      setSessions(updatedSessions);

      
      if (res.session_id) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === res.session_id
              ? {
                  ...s,
                  title:
                    updatedSessions.find((u) => u.id === res.session_id)
                      ?.title || s.title,
                }
              : s,
          ),
        );
      }

      const aiMsg = {
        id: res.message_id,

        role: "assistant",

        content: res.response,

        agent: res.agent,

        intent: res.intent,

        sentiment: res.sentiment,

        sentiment_score: res.sentiment_score,

        response_time_ms: res.response_time_ms,

        timestamp: res.timestamp,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const isTimeout =
        err.message.includes("timed out") || err.message.includes("timeout");

      const errorMsg = isTimeout
        ? "The response is taking longer than usual. Please try sending your message again."
        : err.message.includes("Failed to fetch")
          ? "Connection error. Please check your internet and try again."
          : `Something went wrong: ${err.message}. Please try again.`;

      setMessages((prev) => [
        ...prev,

        {
          id: Date.now(),

          role: "assistant",

          content: `⚠️ ${errorMsg}`,

          agent: "general",

          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, currentSessionId, isTyping]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  const QUICK_QUESTIONS = [
    "What is your return policy?",

    "My laptop won't turn on",

    "Tell me about the UltraBook Pro 15",

    "I want to cancel my subscription",

    "Track my order",

    "TechMart Care pricing",
  ];

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );

  return (
    <>
      <Head>
        <title>TechMart AI Support</title>

        <meta
          name="description"
          content="TechMart Electronics Multi-Agent AI Customer Support"
        />
      </Head>

      <div
        className={`chat-layout ${darkMode ? "dark-mode" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {}

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {}
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={loadSession}
          onNewSession={newSession}
          onDeleteSession={deleteSession}
          user={user}
          darkMode={darkMode}
          onShowAnalytics={() => {
            setShowAnalytics(true);
            setSidebarOpen(false);
          }}
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredSessions={filteredSessions}
          onDeleteAll={async () => {
            setSessions([]);
            setCurrentSessionId(null);
            setMessages([]);
          }}
          onArchiveAll={async () => {
            setSessions([]);
            setCurrentSessionId(null);
            setMessages([]);
          }}
        />

        {}
        <main className="chat-main">
          {}
          <header
            className="flex items-center gap-3 px-4 py-3 bg-white"
            style={{
              borderBottom: "2px solid #EAE7DE",
            }}
          >
            {}
            <button
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {sidebarCollapsed ? (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />

                    <line x1="3" y1="6" x2="21" y2="6" />

                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                ) : (
                  <>
                    <rect x="3" y="3" width="7" height="18" rx="1" />

                    <line x1="14" y1="9" x2="21" y2="9" />

                    <line x1="14" y1="15" x2="21" y2="15" />
                  </>
                )}
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">
                {showAnalytics
                  ? "Analytics Dashboard"
                  : sessions.find((s) => s.id === currentSessionId)?.title ||
                    (currentSessionId ? "Loading..." : "TechMart AI Support")}
              </div>

              <div className="text-xs text-slate-400">
                {showAnalytics
                  ? "Last 30 days"
                  : "Powered by Multi-Agent AI + RAG"}
              </div>
            </div>

            {currentSessionId && !showAnalytics && (
              <button
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-yellow-500 px-3 py-1.5 rounded-lg hover:bg-yellow-50 border border-slate-200 hover:border-yellow-200 transition-all"
                onClick={() => setShowFeedback(true)}
                title="Rate this conversation"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>

                <span>Rate</span>
              </button>
            )}

            {currentSessionId && !showAnalytics && messages.length > 0 && (
              <button
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all"
                onClick={() => {
                  const title =
                    sessions.find((s) => s.id === currentSessionId)?.title ||
                    "conversation";

                  const content = messages

                    .map(
                      (m) =>
                        `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString()}\n${m.content}`,
                    )

                    .join("\n\n---\n\n");

                  const blob = new Blob(
                    [
                      `TechMart AI Support\n${title}\n${"=".repeat(50)}\n\n${content}`,
                    ],
                    { type: "text/plain" },
                  );

                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");

                  a.href = url;

                  a.download = `${title.slice(0, 30)}.txt`;

                  a.click();

                  URL.revokeObjectURL(url);
                }}
                title="Export conversation"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />

                  <polyline points="7 10 12 15 17 10" />

                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>

                <span>Export</span>
              </button>
            )}

            {}
            {currentSessionId && !showAnalytics && (
              <button
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 border border-slate-200 hover:border-orange-200 transition-all"
                onClick={async () => {
                  const confirmed = window.confirm(
                    "Escalate to a human agent?\n\nA TechMart specialist will contact you within 2 business hours.",
                  );

                  if (confirmed) {
                    try {
                      const apiUrl =
                        process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:8000/api";

                      const token = localStorage.getItem("techmart_token");

                      const res = await fetch(
                        `${apiUrl}/escalate?session_id=${currentSessionId}`,

                        {
                          method: "POST",

                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );

                      const data = await res.json();

                      const history =
                        await sessionsAPI.getHistory(currentSessionId);

                      setMessages(history.messages || []);

                      alert(
                        `✅ Escalated Successfully!\n\nReference: ${data.reference}\n\nA human agent will contact you at your registered email within 2 business hours.\n\nOr call: 1-800-TECHMART`,
                      );
                    } catch (err) {
                      alert(
                        "Escalation failed. Please call 1-800-TECHMART directly.",
                      );
                    }
                  }
                }}
                title="Escalate to human agent"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />

                  <circle cx="9" cy="7" r="4" />

                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />

                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>

                <span>Human Agent</span>
              </button>
            )}

            {}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "2px 4px",
              }}
            >
              <button
                onClick={() => setFontSize((prev) => Math.max(11, prev - 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "0 4px",
                  lineHeight: 1,
                }}
                title="Decrease font size"
              >
                A-
              </button>
              <span
                style={{
                  fontSize: 10,
                  color: "#94A3B8",
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize((prev) => Math.min(20, prev + 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748B",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "0 4px",
                  lineHeight: 1,
                }}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {}
            <button
              onClick={toggleDark}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
              title="Toggle dark mode"
            >
              {darkMode ? (
                
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />

                  <line x1="12" y1="1" x2="12" y2="3" />

                  <line x1="12" y1="21" x2="12" y2="23" />

                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />

                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />

                  <line x1="1" y1="12" x2="3" y2="12" />

                  <line x1="21" y1="12" x2="23" y2="12" />

                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />

                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </header>

          {}
          {showAnalytics ? (
            <AnalyticsPanel
              onClose={async () => {
                setShowAnalytics(false);
                
                try {
                  const data = await sessionsAPI.list();
                  setSessions(data);
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          ) : (
            <>
              {}

              <div
                className="flex-1 overflow-y-auto px-4 py-6"
                style={{ fontSize: `${fontSize}px` }}
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center fade-in">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                      T
                    </div>

                    <h2 className="text-xl font-bold text-black mb-2">
                      Welcome to TechMart AI Support
                    </h2>

                    <p className="text-slate-300 text-black mb-8 max-w-black">
                      I'm here to help with billing, technical issues, product
                      info, and more. Ask me anything!
                    </p>

                    <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          className="text-left text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-700"
                          onClick={() => {
                            setInput(q);
                            inputRef.current?.focus();
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}

                  {isTyping && <TypingIndicator />}

                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="px-4 py-4 bg-white">

                {attachedFiles.length > 0 && (
                  <div className="max-w-3xl mx-auto mb-3">
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {attachedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 group"
                        >
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <span className="text-lg">{getFileIcon(file)}</span>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                              {file.name}
                            </div>

                            <div className="text-[10px] text-slate-400">
                              {formatFileSize(file.size)}
                            </div>
                          </div>

                          <button
                            onClick={() => removeFile(index)}
                            className="text-slate-300 hover:text-red-500 transition-colors ml-1"
                            title="Remove file"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />

                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <div className="text-xs text-slate-400 self-center">
                        {attachedFiles.length} file
                        {attachedFiles.length > 1 ? "s" : ""} attached
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-3xl mx-auto flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    rows={1}
                    placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);

                      e.target.style.height = "auto";

                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    className="w-11 h-11 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-400 hover:text-blue-500 flex items-center justify-center flex-shrink-0 transition-all relative"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files (images, PDF, documents)"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>

                    {attachedFiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {attachedFiles.length}
                      </span>
                    )}
                  </button>

                  <button
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                      isListening
                        ? "bg-red-500 text-white border-red-500 voice-listening"
                        : "border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-400 hover:text-blue-500"
                    }
                    
                    `}
                    onClick={startVoice}
                    title={
                      isListening
                        ? "Listening... click to stop"
                        : "Click to use voice input"
                    }
                  >
                    {isListening ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />

                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />

                        <line x1="12" y1="19" x2="12" y2="23" />

                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </button>

                  <button
                    className="btn-send"
                    onClick={sendMessage}
                    disabled={
                      (!input.trim() && attachedFiles.length === 0) || isTyping
                    }
                    title="Send message"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />

                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-2">
                  TechMart AI Support · Powered by Multi-Agent RAG System
                </p>
              </div>
            </>
          )}
        </main>
      </div>


      {showFeedback && (
        <FeedbackModal
          sessionId={currentSessionId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}

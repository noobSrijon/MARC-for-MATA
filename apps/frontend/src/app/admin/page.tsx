"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const SESSION_KEY = "marc_admin_auth";

interface Report {
  _id: string;
  id: string;
  busId: string | number;
  equipmentNumber: string;
  routeShortName?: string;
  routeLongName?: string;
  issueType: string;
  issueIcon: string;
  description: string;
  imageUrls: string[];
  timestamp: number;
  likes: number;
  dislikes: number;
  severityScore: number;
}

function severityColor(score: number): string {
  if (score >= 70) return "#b31b25";
  if (score >= 40) return "#785500";
  return "#2e7d32";
}

function severityBg(score: number): string {
  if (score >= 70) return "#fff0f0";
  if (score >= 40) return "#fffbea";
  return "#f0faf1";
}

function severityLabel(score: number): string {
  if (score >= 70) return "Critical";
  if (score >= 40) return "Moderate";
  return "Low";
}

function severityBarColor(score: number): string {
  if (score >= 70) return "#b31b25";
  if (score >= 40) return "#d97706";
  return "#16a34a";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check sessionStorage for existing auth
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setAuthed(true);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setAuthError("Incorrect password.");
        setPassword("");
        passwordRef.current?.focus();
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/admin/reports`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Auto-select first report once loaded
  useEffect(() => {
    if (reports.length > 0 && !selected) {
      setSelected(reports[0]);
    }
  }, [reports, selected]);

  const handleResolve = async (report: Report) => {
    const reportId = report.id || report._id;
    setResolving(reportId);
    try {
      const res = await fetch(`${API}/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resolve");
      setReports((prev) => prev.filter((r) => (r.id || r._id) !== reportId));
      setSelected((prev) =>
        prev && (prev.id || prev._id) === reportId ? null : prev
      );
    } catch {
      alert("Failed to resolve report. Please try again.");
    } finally {
      setResolving(null);
    }
  };

  if (!authChecked) return null;

  if (!authed) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f6f9",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "40px 36px",
            width: 340,
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            border: "1px solid #e1e2e6",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ color: "#0959b6", fontSize: 26 }}>
              admin_panel_settings
            </span>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: "#2d2f31",
                letterSpacing: "-0.3px",
              }}
            >
              MARC Admin
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#5a5c5e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Password
            </label>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              placeholder="Enter admin password"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: authError ? "1.5px solid #b31b25" : "1.5px solid #e1e2e6",
                fontSize: 15,
                outline: "none",
                color: "#2d2f31",
                background: "#f6f6f9",
              }}
            />
            {authError && (
              <span style={{ fontSize: 12, color: "#b31b25", marginTop: 2 }}>{authError}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={authLoading || !password}
            style={{
              padding: "11px 0",
              background: authLoading || !password ? "#dbdde0" : "#0959b6",
              color: authLoading || !password ? "#757779" : "#fff",
              border: "none",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: authLoading || !password ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {authLoading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f6f6f9",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Left Sidenav ── */}
      <aside
        style={{
          width: 320,
          minWidth: 280,
          background: "#ffffff",
          borderRight: "1px solid #e1e2e6",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid #e1e2e6",
            background: "#0959b6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              className="material-symbols-outlined"
              style={{ color: "#eff2ff", fontSize: 22 }}
            >
              admin_panel_settings
            </span>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: "#eff2ff",
                letterSpacing: "-0.3px",
              }}
            >
              MARC Admin
            </span>
          </div>
        </div>

        {/* Report List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: 24, textAlign: "center", color: "#5a5c5e", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }}>
                hourglass_empty
              </span>
              Loading reports…
            </div>
          )}
          {error && (
            <div style={{ padding: 16, color: "#b31b25", fontSize: 13, textAlign: "center" }}>
              {error}
              <br />
              <button
                onClick={fetchReports}
                style={{
                  marginTop: 8,
                  padding: "4px 12px",
                  background: "#0959b6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && reports.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#5a5c5e", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 8, opacity: 0.3 }}>
                check_circle
              </span>
              No active reports
            </div>
          )}
          {reports.map((r) => {
            const isActive = selected && (selected.id || selected._id) === (r.id || r._id);
            const score = r.severityScore ?? 50;
            return (
              <button
                key={r._id}
                onClick={() => setSelected(r)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f3",
                  background: isActive ? "#eff2ff" : "transparent",
                  borderLeft: isActive ? `3px solid #0959b6` : "3px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                {/* Severity badge */}
                <div
                  style={{
                    minWidth: 44,
                    height: 44,
                    borderRadius: 10,
                    background: severityBg(score),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: severityColor(score),
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <span style={{ fontSize: 9, color: severityColor(score), opacity: 0.8, fontWeight: 600 }}>
                    %
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2d2f31", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.issueType}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: severityBg(score),
                        color: severityColor(score),
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {severityLabel(score)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#5a5c5e", marginBottom: 3 }}>
                    Bus {r.equipmentNumber}
                    {r.routeShortName ? ` · Route ${r.routeShortName}` : ""}
                  </div>
                  {r.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#757779",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 200,
                      }}
                    >
                      {r.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right Panel ── */}
      <main style={{ flex: 1, overflow: "auto", padding: "0" }}>
        {!selected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#acadaf",
              gap: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 56 }}>
              select_window
            </span>
            <p style={{ fontSize: 15, margin: 0 }}>Select a report to view details</p>
          </div>
        ) : (
          <ReportDetail
            report={selected}
            resolving={resolving === (selected.id || selected._id)}
            onResolve={() => handleResolve(selected)}
          />
        )}
      </main>
    </div>
  );
}

function ReportDetail({
  report,
  resolving,
  onResolve,
}: {
  report: Report;
  resolving: boolean;
  onResolve: () => void;
}) {
  const score = report.severityScore ?? 50;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 32px 64px" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: "#2d2f31",
              margin: "0 0 4px",
            }}
          >
            {report.issueType}
          </h1>
          <p style={{ fontSize: 13, color: "#5a5c5e", margin: 0 }}>
            Reported {formatTime(report.timestamp)}
          </p>
        </div>

        <button
          onClick={onResolve}
          disabled={resolving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: resolving ? "#dbdde0" : "#b31b25",
            color: resolving ? "#757779" : "#fff",
            border: "none",
            borderRadius: 10,
            cursor: resolving ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {resolving ? "hourglass_empty" : "check_circle"}
          </span>
          {resolving ? "Resolving…" : "Resolve"}
        </button>
      </div>

      {/* Severity Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 20,
          border: "1px solid #e1e2e6",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#5a5c5e" }}>Severity Score</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 6,
              background: severityBg(score),
              color: severityColor(score),
            }}
          >
            {severityLabel(score)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              flex: 1,
              height: 10,
              background: "#e1e2e6",
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: severityBarColor(score),
                borderRadius: 5,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: severityColor(score),
              minWidth: 52,
              textAlign: "right",
            }}
          >
            {score}
            <span style={{ fontSize: 14, fontWeight: 600 }}>/100</span>
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <InfoCard icon="directions_bus" label="Bus ID" value={String(report.busId)} />
        <InfoCard icon="confirmation_number" label="Equipment #" value={report.equipmentNumber} />
        {report.routeShortName && (
          <InfoCard icon="route" label="Route" value={`${report.routeShortName}${report.routeLongName ? ` – ${report.routeLongName}` : ""}`} />
        )}
        <InfoCard
          icon="thumb_up"
          label="Votes"
          value={`${report.likes ?? 0} helpful · ${report.dislikes ?? 0} not helpful`}
        />
      </div>

      {/* Description */}
      {report.description && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 20,
            border: "1px solid #e1e2e6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0959b6" }}>
              description
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a5c5e" }}>Description</span>
          </div>
          <p style={{ fontSize: 14, color: "#2d2f31", margin: 0, lineHeight: 1.6 }}>
            {report.description}
          </p>
        </div>
      )}

      {/* Images */}
      {report.imageUrls && report.imageUrls.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #e1e2e6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0959b6" }}>
              photo_library
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5a5c5e" }}>
              Photos ({report.imageUrls.length})
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {report.imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img
                  src={url}
                  alt={`Report photo ${i + 1}`}
                  style={{
                    width: 160,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid #e1e2e6",
                    cursor: "zoom-in",
                  }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid #e1e2e6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#0959b6" }}>
          {icon}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#5a5c5e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2f31", margin: 0 }}>{value}</p>
    </div>
  );
}

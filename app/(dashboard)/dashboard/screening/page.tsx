"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import "../../../Style/Dashboard/Screening/screen.css";
import {
  Plus,
  Search,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Archive,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlindSession {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  cv_count: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScreeningPage() {
  const [sessions, setSessions] = useState<BlindSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "archived">(
    "all",
  );

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/blind-screening");
      if (!res.ok) {
        setFetchError(true);
        return;
      }
      const { sessions: data } = await res.json();
      setSessions(data ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    const matchTab = activeTab === "all" || s.status === activeTab;
    const matchSearch =
      !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalActive = sessions.filter((s) => s.status === "active").length;
  const totalArchived = sessions.filter((s) => s.status === "archived").length;
  const totalCVs = sessions.reduce((sum, s) => sum + (s.cv_count ?? 0), 0);

  return (
    <>
      <div className="sc-page">
        {/* ── Header ── */}
        <div className="page-top reveal r1">
          <div>
            <div className="page-title">CV Screening</div>
            <div className="page-sub">
              Screen CVs without posting a job — build your talent pool
            </div>
          </div>
          <Link href="/dashboard/screening/new" className="btn-primary">
            <Plus size={14} /> New Screening Session
          </Link>
        </div>

        {/* ── Info banner ── */}
        <div className="info-banner reveal r1">
          <Zap
            size={16}
            color="#7C3AED"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div className="info-banner-text">
            Blind screening lets you upload and AI-score CVs without creating a
            job posting. CV usage counts toward your monthly limit shared with
            job-based screening.
          </div>
        </div>

        {/* ── Mini stats ── */}
        <div className="mini-stats reveal r2">
          <div className="mini-stat">
            <div
              className="ms-icon"
              style={{ background: "rgba(124,58,237,.1)" }}
            >
              <FileText size={18} color="#7C3AED" />
            </div>
            <div>
              <div className="ms-val">{sessions.length}</div>
              <div className="ms-lbl">Total Sessions</div>
            </div>
          </div>
          <div className="mini-stat">
            <div
              className="ms-icon"
              style={{ background: "rgba(34,197,94,.1)" }}
            >
              <CheckCircle2 size={18} color="#22c55e" />
            </div>
            <div>
              <div className="ms-val">{totalActive}</div>
              <div className="ms-lbl">Active</div>
            </div>
          </div>
          <div className="mini-stat">
            <div
              className="ms-icon"
              style={{ background: "rgba(100,116,139,.1)" }}
            >
              <Archive size={18} color="#64748b" />
            </div>
            <div>
              <div className="ms-val">{totalArchived}</div>
              <div className="ms-lbl">Archived</div>
            </div>
          </div>
          <div className="mini-stat">
            <div
              className="ms-icon"
              style={{ background: "rgba(59,130,246,.1)" }}
            >
              <TrendingUp size={18} color="#3b82f6" />
            </div>
            <div>
              <div className="ms-val">{totalCVs}</div>
              <div className="ms-lbl">CVs Uploaded</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar reveal r3">
          <div className="search-wrap">
            <Search size={14} color="#94a3b8" className="search-ico" />
            <input
              className="search-inp"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs-wrap">
            {(["all", "active", "archived"] as const).map((tab) => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error banner ── */}
        {fetchError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "13px 18px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                Failed to load sessions. Please try again.
              </span>
            </div>
            <button
              onClick={fetchSessions}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg,#7C3AED,#5b21b6)",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Sessions list ── */}
        <div className="sessions-list reveal r4">
          {/* Skeleton */}
          {loading &&
            [1, 2, 3].map((i) => (
              <div key={i} className="skel-card">
                <div
                  className="skeleton"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 14, width: "40%" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 11, width: "60%" }}
                  />
                </div>
                <div
                  className="skeleton"
                  style={{ height: 28, width: 80, borderRadius: 20 }}
                />
              </div>
            ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={24} color="#7C3AED" />
              </div>
              <div className="empty-title">
                {search
                  ? "No sessions match your search"
                  : "No screening sessions yet"}
              </div>
              <div className="empty-sub">
                {search
                  ? "Try a different search term."
                  : "Create your first session to start screening CVs without a job posting."}
              </div>
              {!search && (
                <Link
                  href="/dashboard/screening/new"
                  className="btn-primary"
                  style={{ display: "inline-flex" }}
                >
                  <Plus size={14} /> New Screening Session
                </Link>
              )}
            </div>
          )}

          {/* Session cards */}
          {!loading &&
            filtered.map((session) => (
              <Link
                key={session.id}
                href={`/dashboard/screening/${session.id}`}
                className="session-card"
              >
                <div className="session-icon">
                  <FileText size={20} color="#7C3AED" />
                </div>
                <div className="session-info">
                  <div className="session-name">{session.name}</div>
                  <div className="session-meta">
                    <span className="session-meta-item">
                      <Users
                        size={11}
                        style={{ display: "inline", marginRight: 3 }}
                      />
                      {session.cv_count} CVs
                    </span>
                    <span className="s-dot" />
                    <span className="session-meta-item">
                      <Clock
                        size={11}
                        style={{ display: "inline", marginRight: 3 }}
                      />
                      {timeAgo(session.created_at)}
                    </span>
                  </div>
                  {session.description && (
                    <div className="session-desc">{session.description}</div>
                  )}
                </div>
                <span
                  className="status-pill"
                  style={
                    session.status === "active"
                      ? { color: "#16a34a", background: "rgba(34,197,94,.1)" }
                      : { color: "#64748b", background: "rgba(100,116,139,.1)" }
                  }
                >
                  {session.status === "active" ? "Active" : "Archived"}
                </span>
                <ChevronRight size={16} color="#cbd5e1" />
              </Link>
            ))}
        </div>
      </div>
    </>
  );
}

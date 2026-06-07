"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .sc-page {
          min-height: 100%; background: #f8fafc;
          padding: 28px 32px 60px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { background-position: -400px 0; }
          to   { background-position: 400px 0; }
        }
        .reveal { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
        .r1 { animation-delay: .04s; } .r2 { animation-delay: .10s; }
        .r3 { animation-delay: .16s; } .r4 { animation-delay: .22s; }

        .page-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .page-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -.4px; }
        .page-sub { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 3px; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          border: none; font-size: 13px; font-weight: 700; color: #fff;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 12px rgba(124,58,237,.28);
          transition: transform .18s, box-shadow .18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,58,237,.36); }

        .mini-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 22px;
        }
        .mini-stat {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 16px 18px;
          display: flex; align-items: center; gap: 12px;
        }
        .ms-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ms-val { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -.5px; }
        .ms-lbl { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 1px; }

        .toolbar {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 18px; flex-wrap: wrap;
        }
        .search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 300px; }
        .search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .search-inp {
          width: 100%; padding: 8px 12px 8px 34px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; background: #fff; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .search-inp::placeholder { color: #94a3b8; }
        .search-inp:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,.08); }

        .tabs-wrap { display: flex; gap: 6px; }
        .tab-btn {
          padding: 7px 14px; border-radius: 9px; border: 1.5px solid #e2e8f0;
          background: #fff; font-size: 12px; font-weight: 600; color: #64748b;
          cursor: pointer; transition: all .18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .tab-btn.active { border-color: #7C3AED; color: #7C3AED; background: rgba(124,58,237,.06); }

        .sessions-list { display: flex; flex-direction: column; gap: 10px; }

        .session-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 18px 20px;
          display: flex; align-items: center; gap: 16px;
          text-decoration: none; transition: box-shadow .2s, transform .18s;
        }
        .session-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07); transform: translateY(-1px); }

        .session-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(124,58,237,.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .session-info { flex: 1; min-width: 0; }
        .session-name {
          font-size: 14px; font-weight: 700; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .session-meta {
          display: flex; align-items: center;
          gap: 8px; margin-top: 4px; flex-wrap: wrap;
        }
        .session-meta-item { font-size: 11px; color: #64748b; font-weight: 500; }
        .s-dot { width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1; }
        .session-desc {
          font-size: 12px; color: #94a3b8; margin-top: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .status-pill {
          font-size: 11px; font-weight: 700; padding: 4px 11px;
          border-radius: 20px; white-space: nowrap; flex-shrink: 0;
        }

        .skel-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 14px; padding: 18px 20px;
          display: flex; align-items: center; gap: 16px;
        }
        .skeleton {
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite;
        }

        .empty-state {
          background: #fff; border: 1px dashed #e2e8f0;
          border-radius: 16px; padding: 56px 24px; text-align: center;
        }
        .empty-icon {
          width: 56px; height: 56px; border-radius: 14px;
          background: rgba(124,58,237,.08);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .empty-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: #94a3b8; margin-bottom: 18px; }

        .info-banner {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
          background: rgba(124,58,237,.05);
          border: 1px solid rgba(124,58,237,.15);
        }
        .info-banner-text { font-size: 13px; color: #5b21b6; font-weight: 500; line-height: 1.5; }

        @media (max-width: 768px) {
          .sc-page { padding: 20px 16px 48px; }
          .mini-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

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

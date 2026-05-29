"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Copy,
  MoreVertical,
  Filter,
  SlidersHorizontal,
  Zap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = "active" | "draft" | "closed";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  status: JobStatus;
  slug: string;
  candidates_count: number;
  screened_count: number;
  created_at: string;
  closes_at?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusTabs: { key: "all" | JobStatus; label: string }[] = [
  { key: "all", label: "All Jobs" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Drafts" },
  { key: "closed", label: "Closed" },
];

const statusConfig: Record<
  JobStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  active: {
    label: "Active",
    color: "#16a34a",
    bg: "rgba(34,197,94,0.1)",
    icon: CheckCircle2,
  },
  draft: {
    label: "Draft",
    color: "#d97706",
    bg: "rgba(245,158,11,0.1)",
    icon: Clock,
  },
  closed: {
    label: "Closed",
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    icon: XCircle,
  },
};

const employmentLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

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

function copyLink(slug: string) {
  const url = `${window.location.origin}/apply/${slug}`;
  navigator.clipboard.writeText(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const supabase = createSupabaseBrowserClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | JobStatus>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>("");

  // fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/jobs");
    const { jobs } = await res.json();
    setJobs(jobs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single();
      if (profile?.company_id) {
        setCompanyId(profile.company_id);
        fetchJobs();
      }
    })();
  }, [supabase, fetchJobs]);

  // filtered list
  const filtered = jobs.filter((j) => {
    const matchTab = activeTab === "all" || j.status === activeTab;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // stats
  const totalActive = jobs.filter((j) => j.status === "active").length;
  const totalDraft = jobs.filter((j) => j.status === "draft").length;
  const totalClosed = jobs.filter((j) => j.status === "closed").length;
  const totalScreened = jobs.reduce((s, j) => s + (j.screened_count ?? 0), 0);

  // handle copy link
  const handleCopy = (job: Job) => {
    copyLink(job.slug);
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2000);
    setOpenMenu(null);
  };

  // handle status change
  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    setOpenMenu(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .jobs-page {
          min-height: 100%;
          background: #f8fafc;
          padding: 28px 32px 48px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Fade up ── */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .reveal { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .r1{animation-delay:.04s} .r2{animation-delay:.10s}
        .r3{animation-delay:.16s} .r4{animation-delay:.22s}

        /* ── Page header ── */
        .page-top {
          display:flex; align-items:flex-start;
          justify-content:space-between; gap:16px;
          margin-bottom:24px; flex-wrap:wrap;
        }
        .page-title  { font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-.4px; }
        .page-sub    { font-size:13px; color:#64748b; margin-top:3px; font-weight:500; }
        .btn-primary {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:10px;
          background:linear-gradient(135deg,#7C3AED,#5b21b6);
          border:none; font-size:13px; font-weight:700; color:#fff;
          cursor:pointer; text-decoration:none;
          box-shadow:0 4px 12px rgba(124,58,237,.28);
          transition:transform .18s, box-shadow .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
          white-space:nowrap;
        }
        .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,.36); }

        /* ── Mini stats ── */
        .mini-stats {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:14px; margin-bottom:22px;
        }
        .mini-stat {
          background:#fff; border:1px solid #e2e8f0; border-radius:12px;
          padding:16px 18px; display:flex; align-items:center; gap:12px;
          transition:box-shadow .2s;
        }
        .mini-stat:hover { box-shadow:0 4px 16px rgba(0,0,0,.06); }
        .ms-icon {
          width:38px; height:38px; border-radius:10px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .ms-val  { font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-.5px; }
        .ms-lbl  { font-size:11px; color:#64748b; font-weight:500; margin-top:1px; }

        /* ── Toolbar ── */
        .toolbar {
          display:flex; align-items:center; gap:12px;
          margin-bottom:18px; flex-wrap:wrap;
        }
        .search-wrap {
          position:relative; flex:1; min-width:200px; max-width:340px;
        }
        .search-ico {
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          pointer-events:none;
        }
        .search-input {
          width:100%; padding:9px 12px 9px 38px;
          border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:13px; font-family:'Plus Jakarta Sans',sans-serif;
          color:#0f172a; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .search-input::placeholder { color:#94a3b8; }
        .search-input:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08); }

        /* ── Status tabs ── */
        .tabs-wrap { display:flex; gap:6px; flex-wrap:wrap; }
        .tab-btn {
          padding:7px 14px; border-radius:8px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:12px; font-weight:600; color:#64748b;
          cursor:pointer; transition:all .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .tab-btn:hover   { border-color:#c4b5fd; color:#7C3AED; }
        .tab-btn.active  { border-color:#7C3AED; background:rgba(124,58,237,.07); color:#7C3AED; }

        /* ── Job card ── */
        .jobs-list { display:flex; flex-direction:column; gap:12px; }

        .job-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:14px;
          padding:18px 20px; display:flex; align-items:center; gap:16px;
          transition:box-shadow .2s, transform .18s; position:relative;
        }
        .job-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.07); transform:translateY(-1px); }

        .job-card-icon {
          width:46px; height:46px; border-radius:12px;
          background:rgba(124,58,237,.08);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .job-card-info { flex:1; min-width:0; }
        .job-card-title {
          font-size:14px; font-weight:700; color:#0f172a;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .job-card-meta {
          display:flex; align-items:center; gap:8px; margin-top:5px; flex-wrap:wrap;
        }
        .meta-chip {
          font-size:11px; color:#64748b; font-weight:500;
          display:flex; align-items:center; gap:4px;
        }
        .meta-dot { width:3px; height:3px; border-radius:50%; background:#cbd5e1; flex-shrink:0; }

        /* screening progress */
        .screen-progress { display:flex; flex-direction:column; gap:4px; min-width:110px; }
        .sp-row { display:flex; justify-content:space-between; }
        .sp-label { font-size:11px; color:#94a3b8; }
        .sp-pct   { font-size:11px; font-weight:700; color:#7C3AED; }
        .sp-track { height:4px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
        .sp-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,#7C3AED,#a78bfa); }

        /* status badge */
        .status-badge {
          display:inline-flex; align-items:center; gap:5px;
          font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px;
          white-space:nowrap;
        }

        /* actions */
        .card-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .action-btn {
          display:flex; align-items:center; gap:6px;
          padding:7px 13px; border-radius:9px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:12px; font-weight:600; color:#374151;
          cursor:pointer; text-decoration:none; white-space:nowrap;
          transition:border-color .2s, color .2s, box-shadow .2s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .action-btn:hover { border-color:#7C3AED; color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08); }
        .action-btn.copied { border-color:#22c55e; color:#16a34a; }

        /* 3-dot menu */
        .menu-wrap { position:relative; }
        .menu-trigger {
          width:34px; height:34px; border-radius:9px; border:1.5px solid #e2e8f0;
          background:#fff; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:border-color .2s;
        }
        .menu-trigger:hover { border-color:#7C3AED; }
        .dropdown-menu {
          position:absolute; right:0; top:calc(100% + 6px);
          background:#fff; border:1px solid #e2e8f0;
          border-radius:12px; padding:6px;
          box-shadow:0 10px 40px rgba(0,0,0,.12);
          min-width:160px; z-index:50;
        }
        .drop-item {
          display:flex; align-items:center; gap:9px;
          padding:9px 12px; border-radius:8px; font-size:13px; font-weight:500;
          color:#374151; cursor:pointer; transition:background .15s;
          white-space:nowrap;
        }
        .drop-item:hover { background:#f8fafc; color:#0f172a; }
        .drop-item.danger { color:#ef4444; }
        .drop-item.danger:hover { background:rgba(239,68,68,.06); }
        .drop-divider { height:1px; background:#f1f5f9; margin:4px 0; }

        /* ── Empty state ── */
        .empty-state {
          background:#fff; border:1px dashed #e2e8f0; border-radius:16px;
          padding:56px 24px; text-align:center;
        }
        .empty-icon {
          width:60px; height:60px; border-radius:16px; background:rgba(124,58,237,.08);
          display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
        }
        .empty-title { font-size:16px; font-weight:700; color:#0f172a; margin-bottom:6px; }
        .empty-sub   { font-size:13px; color:#94a3b8; margin-bottom:20px; max-width:320px; margin-left:auto; margin-right:auto; }

        /* ── Skeleton ── */
        @keyframes shimmer {
          from { background-position:-400px 0; }
          to   { background-position:400px 0; }
        }
        .skeleton {
          background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
          background-size:800px 100%; animation:shimmer 1.4s infinite;
          border-radius:8px;
        }
        .skel-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:14px;
          padding:18px 20px; display:flex; align-items:center; gap:16px;
        }

        /* ── Responsive ── */
        @media (max-width:900px) {
          .mini-stats { grid-template-columns:repeat(2,1fr); }
          .screen-progress { display:none; }
        }
        @media (max-width:640px) {
          .jobs-page  { padding:20px 16px 40px; }
          .mini-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
          .card-actions .action-btn span { display:none; }
          .job-card   { flex-wrap:wrap; }
        }
      `}</style>

      <div className="jobs-page" onClick={() => setOpenMenu(null)}>
        {/* ── Header ── */}
        <div className="page-top reveal r1">
          <div>
            <div className="page-title">Jobs</div>
            <div className="page-sub">
              Manage your job postings and track screening progress
            </div>
          </div>
          <Link href="/dashboard/jobs/new" className="btn-primary">
            <Plus size={14} /> Post New Job
          </Link>
        </div>

        {/* ── Mini stats ── */}
        <div className="mini-stats reveal r2">
          <div className="mini-stat">
            <div
              className="ms-icon"
              style={{ background: "rgba(124,58,237,.1)" }}
            >
              <Briefcase size={18} color="#7C3AED" />
            </div>
            <div>
              <div className="ms-val">{jobs.length}</div>
              <div className="ms-lbl">Total Jobs</div>
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
              style={{ background: "rgba(245,158,11,.1)" }}
            >
              <Clock size={18} color="#f59e0b" />
            </div>
            <div>
              <div className="ms-val">{totalDraft}</div>
              <div className="ms-lbl">Drafts</div>
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
              <div className="ms-val">{totalScreened}</div>
              <div className="ms-lbl">CVs Screened</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar reveal r3">
          <div className="search-wrap">
            <Search size={15} color="#94a3b8" className="search-ico" />
            <input
              className="search-input"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs-wrap">
            {statusTabs.map((t) => (
              <button
                key={t.key}
                className={`tab-btn${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.key !== "all" && (
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>
                    (
                    {t.key === "active"
                      ? totalActive
                      : t.key === "draft"
                        ? totalDraft
                        : totalClosed}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Job list ── */}
        <div className="jobs-list reveal r4">
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
                <Briefcase size={26} color="#7C3AED" />
              </div>
              <div className="empty-title">
                {search ? "No jobs match your search" : "No jobs yet"}
              </div>
              <div className="empty-sub">
                {search
                  ? "Try a different search term or clear the filter."
                  : "Post your first job to start screening candidates with AI."}
              </div>
              {!search && (
                <Link
                  href="/dashboard/jobs/new"
                  className="btn-primary"
                  style={{ display: "inline-flex" }}
                >
                  <Plus size={14} /> Post a Job
                </Link>
              )}
            </div>
          )}

          {/* Job cards */}
          {!loading &&
            filtered.map((job) => {
              const cfg = statusConfig[job.status];
              const StatusIcon = cfg.icon;
              const screenPct =
                job.candidates_count > 0
                  ? Math.round(
                      (job.screened_count / job.candidates_count) * 100,
                    )
                  : 0;

              return (
                <div key={job.id} className="job-card">
                  {/* Icon */}
                  <div className="job-card-icon">
                    <Briefcase size={20} color="#7C3AED" />
                  </div>

                  {/* Info */}
                  <div className="job-card-info">
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-meta">
                      {job.department && (
                        <span className="meta-chip">{job.department}</span>
                      )}
                      {job.location && (
                        <>
                          <span className="meta-dot" />
                          <span className="meta-chip">{job.location}</span>
                        </>
                      )}
                      <span className="meta-dot" />
                      <span className="meta-chip">
                        {employmentLabels[job.employment_type] ?? "Full-time"}
                      </span>
                      <span className="meta-dot" />
                      <span className="meta-chip">
                        <Clock size={11} /> {timeAgo(job.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Screening progress */}
                  <div className="screen-progress">
                    <div className="sp-row">
                      <span className="sp-label">
                        {job.screened_count}/{job.candidates_count} screened
                      </span>
                      <span className="sp-pct">{screenPct}%</span>
                    </div>
                    <div className="sp-track">
                      <div
                        className="sp-fill"
                        style={{ width: `${screenPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="status-badge"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    <StatusIcon size={11} />
                    {cfg.label}
                  </span>

                  {/* Actions */}
                  <div
                    className="card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Copy apply link */}
                    <button
                      className={`action-btn${copiedId === job.id ? " copied" : ""}`}
                      onClick={() => handleCopy(job)}
                      title="Copy apply link"
                    >
                      {copiedId === job.id ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* View detail */}
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="action-btn"
                    >
                      <Users size={13} /> <span>Candidates</span>
                      <ChevronRight size={12} />
                    </Link>

                    {/* 3-dot menu */}
                    <div className="menu-wrap">
                      <button
                        className="menu-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === job.id ? null : job.id);
                        }}
                      >
                        <MoreVertical size={15} color="#64748b" />
                      </button>

                      {openMenu === job.id && (
                        <div
                          className="dropdown-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="drop-item"
                            onClick={() => setOpenMenu(null)}
                          >
                            <FileText size={14} /> View Details
                          </Link>
                          <Link
                            href={`/dashboard/jobs/${job.id}/upload`}
                            className="drop-item"
                            onClick={() => setOpenMenu(null)}
                          >
                            <Zap size={14} /> Upload CVs
                          </Link>
                          <div
                            className="drop-item"
                            onClick={() => handleCopy(job)}
                          >
                            <Copy size={14} /> Copy Apply Link
                          </div>
                          <div className="drop-divider" />
                          {job.status !== "active" && (
                            <div
                              className="drop-item"
                              onClick={() =>
                                handleStatusChange(job.id, "active")
                              }
                            >
                              <CheckCircle2 size={14} color="#22c55e" /> Set
                              Active
                            </div>
                          )}
                          {job.status !== "draft" && (
                            <div
                              className="drop-item"
                              onClick={() =>
                                handleStatusChange(job.id, "draft")
                              }
                            >
                              <Clock size={14} color="#f59e0b" /> Move to Draft
                            </div>
                          )}
                          {job.status !== "closed" && (
                            <div
                              className="drop-item danger"
                              onClick={() =>
                                handleStatusChange(job.id, "closed")
                              }
                            >
                              <XCircle size={14} /> Close Job
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

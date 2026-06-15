"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Trash2,
} from "lucide-react";
import "../../../Style/Dashboard/Jobs/jobs.css";

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

async function copyLink(slug: string): Promise<boolean> {
  const url = `${window.location.origin}/apply/${slug}`;

  // Method 1 — modern clipboard API (HTTPS only)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      console.error("Clipboard API failed:", err);
      // fall through to Method 2
    }
  }

  // Method 2 — legacy execCommand fallback (HTTP or older browsers)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed"; // prevent page scroll
    textarea.style.opacity = "0"; // invisible
    textarea.style.pointerEvents = "none"; // unclickable
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error("execCommand fallback failed:", err);
    return false;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const supabase = createSupabaseBrowserClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    draft: 0,
    closed: 0,
  });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | JobStatus>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string>("");
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [deleteJobDialogOpen, setDeleteJobDialogOpen] = useState(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [deleteJobConfirmText, setDeleteJobConfirmText] = useState("");
  const [deletingJob, setDeletingJob] = useState(false);

  // fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/jobs");

      if (!res.ok) {
        setFetchError(true);
        setJobs([]);
        return;
      }

      const { jobs, counts: apiCounts } = await res.json();
      setJobs(jobs ?? []);

      // Use API counts if returned, fall back to computing from array
      if (apiCounts) {
        setCounts(apiCounts);
      } else {
        // fallback — safe for old API responses during deployment
        setCounts({
          total: (jobs ?? []).length,
          active: (jobs ?? []).filter((j: Job) => j.status === "active").length,
          draft: (jobs ?? []).filter((j: Job) => j.status === "draft").length,
          closed: (jobs ?? []).filter((j: Job) => j.status === "closed").length,
        });
      }
    } catch (err) {
      setFetchError(true);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  useEffect(() => {
    if (!statusError) return;
    const timer = setTimeout(() => setStatusError(null), 4000);
    return () => clearTimeout(timer);
  }, [statusError]);
  const handleCloseMenu = useCallback(() => setOpenMenu(null), []);
  useOutsideClick(menuRef, handleCloseMenu, openMenu !== null);

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
  const totalActive = counts.active;
  const totalDraft = counts.draft;
  const totalClosed = counts.closed;
  const totalScreened = jobs.reduce((s, j) => s + (j.screened_count ?? 0), 0);

  // handle copy link
  const handleCopy = async (job: Job) => {
    const success = await copyLink(job.slug);

    if (success) {
      // ✅ Copy worked — show green "Copied!" feedback
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      // ❌ Copy failed — show the URL so user can copy manually
      setCopyFailed(job.id);
      setFailedUrl(`${window.location.origin}/apply/${job.slug}`);
      setTimeout(() => {
        setCopyFailed(null);
        setFailedUrl("");
      }, 6000);
    }

    setOpenMenu(null);
  };

  const handleDeleteJob = async () => {
    if (!deleteJobTarget || deleteJobConfirmText !== "DELETE") return;
    setDeletingJob(true);

    const previousJobs = jobs;
    const previousCounts = counts;
    const jobToDelete = deleteJobTarget;

    setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
    setCounts((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      [jobToDelete.status]: Math.max(0, prev[jobToDelete.status] - 1),
    }));
    setDeleteJobDialogOpen(false);
    setDeleteJobTarget(null);
    setDeleteJobConfirmText("");

    try {
      const res = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setJobs(previousJobs);
        setCounts(previousCounts);
        setStatusError("Failed to delete job. Please try again.");
      }
    } catch {
      setJobs(previousJobs);
      setCounts(previousCounts);
      setStatusError("Network error — job was not deleted.");
    } finally {
      setDeletingJob(false);
    }
  };
  // handle status change
  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    // Block if this job already has a pending request
    if (updatingJobId === jobId) return;

    if (newStatus === "closed") {
      const confirmed = window.confirm(
        "Close this job? It will stop accepting new applications.",
      );
      if (!confirmed) return;
    }

    const previousJobs = jobs;
    const previousCounts = counts;
    const oldStatus = jobs.find((j) => j.id === jobId)?.status;

    // Lock this job — blocks all further clicks
    setUpdatingJobId(jobId);

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)),
    );

    if (oldStatus && oldStatus !== newStatus) {
      setCounts((prev) => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus] - 1),
        [newStatus]: prev[newStatus] + 1,
      }));
    }
    setOpenMenu(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Step 3a — API failed, roll back to snapshot
        const { error } = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        setJobs(previousJobs);
        setCounts(previousCounts);
        setStatusError(`Failed to update status: ${error ?? res.status}`);
        setUpdatingJobId(null);
        return;
      }
      setUpdatingJobId(null);
    } catch (err) {
      // Step 3b — Network crashed, roll back to snapshot
      console.error("handleStatusChange error:", err);
      setJobs(previousJobs);
      setCounts(previousCounts);
      setStatusError("Network error — status change was not saved.");
      setUpdatingJobId(null);
    }
  };
  // ─── Hook: close menu on outside click or Escape ──────────────────────────

  function useOutsideClick(
    ref: React.RefObject<HTMLElement | null>,
    onClose: () => void,
    enabled: boolean,
  ) {
    useEffect(() => {
      if (!enabled) return;

      let startX = 0;
      let startY = 0;

      // Track where the pointer went DOWN
      const handlePointerDown = (e: PointerEvent) => {
        startX = e.clientX;
        startY = e.clientY;
      };

      // Only close if pointer UP is in same spot — real tap not scroll
      const handlePointerUp = (e: PointerEvent) => {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        const isScroll = dx > 8 || dy > 8; // moved more than 8px = scroll

        if (isScroll) return; // ignore scroll gestures

        if (ref.current && !ref.current.contains(e.target as Node)) {
          onClose();
        }
      };

      // Close on Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [ref, onClose, enabled]);
  }

  return (
    <>
      <div className="jobs-page">
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
        {/* ── Error Banner ── */}
        {fetchError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "13px 18px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <AlertCircle size={16} color="#ef4444" />
              <span
                style={{
                  fontSize: "13px",
                  color: "#dc2626",
                  fontWeight: 500,
                }}
              >
                Failed to load jobs. Please check your connection and try again.
              </span>
            </div>
            <button
              onClick={fetchJobs}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg,#7C3AED,#5b21b6)",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Retry
            </button>
          </div>
        )}
        {/* ── Status Change Error Toast ── */}
        {statusError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "13px 18px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <AlertCircle size={16} color="#ef4444" />
              <span
                style={{
                  fontSize: "13px",
                  color: "#dc2626",
                  fontWeight: 500,
                }}
              >
                {statusError}
              </span>
            </div>
            <button
              onClick={() => setStatusError(null)}
              style={{
                padding: "6px 14px",
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#dc2626",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Copy Failed Banner ── */}
        {copyFailed && failedUrl && (
          <div
            style={{
              padding: "13px 18px",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <AlertCircle size={14} color="#d97706" />
              <span
                style={{
                  fontSize: "13px",
                  color: "#d97706",
                  fontWeight: 600,
                }}
              >
                Could not copy automatically — copy the link below:
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: "12px",
                  color: "#374151",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {failedUrl}
              </span>
            </div>
          </div>
        )}

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
                      style={{ minWidth: 160 }}
                    >
                      {copiedId === job.id ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Copied!</span>
                        </>
                      ) : copyFailed === job.id ? (
                        <>
                          <AlertCircle size={13} color="#ef4444" />
                          <span style={{ color: "#ef4444" }}>Failed</span>
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
                          ref={menuRef}
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
                          {/* Show spinner row when this job is updating */}
                          {updatingJobId === job.id ? (
                            <div
                              className="drop-item"
                              style={{
                                opacity: 0.6,
                                cursor: "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                  animation: "spin 0.7s linear infinite",
                                }}
                              >
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              Updating...
                            </div>
                          ) : (
                            <>
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
                                  <Clock size={14} color="#f59e0b" /> Move to
                                  Draft
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
                              <div className="drop-divider" />
                              <div
                                className="drop-item danger"
                                onClick={() => {
                                  setDeleteJobTarget(job);
                                  setDeleteJobDialogOpen(true);
                                  setOpenMenu(null);
                                }}
                              >
                                <Trash2 size={14} /> Delete Job
                              </div>
                            </>
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

      {/* ── Delete Job Confirmation Dialog ── */}
      {deleteJobDialogOpen && deleteJobTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => {
            setDeleteJobDialogOpen(false);
            setDeleteJobConfirmText("");
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              Delete Job
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              This will permanently delete{" "}
              <strong>{deleteJobTarget.title}</strong> and all its candidates,
              CV files, and AI screening results.
            </div>
            <div
              style={{
                background: "rgba(239,68,68,.06)",
                border: "1px solid rgba(239,68,68,.2)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                color: "#dc2626",
                fontWeight: 500,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              ⚠️ All CV files and screening results will be permanently lost.
              This cannot be undone.
            </div>
            <input
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                color: "#0f172a",
                outline: "none",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
              placeholder='Type "DELETE" to confirm'
              value={deleteJobConfirmText}
              onChange={(e) => setDeleteJobConfirmText(e.target.value)}
              autoFocus
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 9,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
                onClick={() => {
                  setDeleteJobDialogOpen(false);
                  setDeleteJobConfirmText("");
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 18px",
                  borderRadius: 9,
                  background:
                    deleteJobConfirmText === "DELETE" && !deletingJob
                      ? "#ef4444"
                      : "#fca5a5",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor:
                    deleteJobConfirmText === "DELETE"
                      ? "pointer"
                      : "not-allowed",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
                onClick={handleDeleteJob}
                disabled={deleteJobConfirmText !== "DELETE" || deletingJob}
              >
                <Trash2 size={13} />
                {deletingJob ? "Deleting..." : "Delete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

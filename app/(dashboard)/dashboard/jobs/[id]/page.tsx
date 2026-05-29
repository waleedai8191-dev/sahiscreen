"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Upload,
  Copy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  MoreVertical,
  Zap,
  Star,
  AlertTriangle,
  Eye,
  Trash2,
  ExternalLink,
  TrendingUp,
  Award,
  Target,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = "active" | "draft" | "closed";
type ScreeningStatus = "pending" | "processing" | "completed" | "failed";
type CandidateStatus = "shortlisted" | "rejected" | "reviewing" | "new";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  status: JobStatus;
  slug: string;
  description: string;
  requirements: string;
  responsibilities: string;
  skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  created_at: string;
  candidates_count: number;
  screened_count: number;
}

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  cv_url: string;
  status: CandidateStatus;
  screening_status: ScreeningStatus;
  ai_score: number | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_red_flags: string[] | null;
  ai_justification: string | null;
  university: string | null;
  years_experience: number | null;
  applied_at: string;
  source: "manual" | "apply_link";
}

// ─── Config ───────────────────────────────────────────────────────────────────

const scoreColor = (score: number | null) => {
  if (!score)
    return { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: "—" };
  if (score >= 80)
    return { color: "#16a34a", bg: "rgba(34,197,94,0.1)", label: "Strong" };
  if (score >= 60)
    return { color: "#d97706", bg: "rgba(245,158,11,0.1)", label: "Good" };
  if (score >= 40)
    return { color: "#ea580c", bg: "rgba(234,88,12,0.1)", label: "Fair" };
  return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Weak" };
};

const candidateStatusConfig: Record<
  CandidateStatus,
  { label: string; color: string; bg: string }
> = {
  new: { label: "New", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  reviewing: {
    label: "Reviewing",
    color: "#d97706",
    bg: "rgba(245,158,11,0.1)",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "#16a34a",
    bg: "rgba(34,197,94,0.1)",
  },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

const employmentLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const expLabels: Record<string, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior",
  lead: "Lead / Manager",
  director: "Director",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  ["#7C3AED", "#ede9fe"],
  ["#2563eb", "#dbeafe"],
  ["#16a34a", "#dcfce7"],
  ["#d97706", "#fef3c7"],
  ["#db2777", "#fce7f3"],
  ["#0891b2", "#cffafe"],
];
function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<
    "all" | "strong" | "good" | "fair" | "weak"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CandidateStatus>(
    "all",
  );
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/jobs/${id}`);
    const json = await res.json();
    if (json.job) setJob(json.job as Job);
    if (json.candidates) setCandidates(json.candidates as Candidate[]);
    setLoading(false);
  }, [id]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCopyLink = () => {
    if (!job) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/apply/${job.slug}`,
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStatusChange = async (
    candidateId: string,
    status: CandidateStatus,
  ) => {
    setUpdatingId(candidateId);
    await fetch(`/api/screening/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: status, notes: "" }),
    });
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status } : c)),
    );
    setUpdatingId(null);
    setOpenMenu(null);
  };

  const handleJobStatusChange = async (status: JobStatus) => {
    if (!job) return;
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setJob((j) => (j ? { ...j, status } : j));
  };

  const handleDelete = async (candidateId: string) => {
    if (!confirm("Remove this candidate?")) return;
    await fetch(`/api/candidates/${candidateId}`, {
      method: "DELETE",
    });
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setOpenMenu(null);
  };
  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = candidates
    .filter((c) => {
      if (
        search &&
        !c.candidate_name.toLowerCase().includes(search.toLowerCase()) &&
        !c.candidate_email.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (scoreFilter !== "all") {
        const s = c.ai_score ?? 0;
        if (scoreFilter === "strong" && s < 80) return false;
        if (scoreFilter === "good" && (s < 60 || s >= 80)) return false;
        if (scoreFilter === "fair" && (s < 40 || s >= 60)) return false;
        if (scoreFilter === "weak" && s >= 40) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.ai_score ?? -1) - (a.ai_score ?? -1);
      return (
        new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      );
    });

  const shortlisted = candidates.filter(
    (c) => c.status === "shortlisted",
  ).length;
  const screened = candidates.filter(
    (c) => c.screening_status === "completed",
  ).length;
  const avgScore =
    screened > 0
      ? Math.round(
          candidates
            .filter((c) => c.ai_score)
            .reduce((s, c) => s + (c.ai_score ?? 0), 0) / screened,
        )
      : null;

  if (loading)
    return (
      <div
        style={{ padding: 32, fontFamily: "'Plus Jakarta Sans',sans-serif" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background:
                    "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                  backgroundSize: "800px 100%",
                  animation: "shimmer 1.4s infinite",
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
                  style={{
                    height: 14,
                    width: "35%",
                    borderRadius: 6,
                    background:
                      "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                    backgroundSize: "800px 100%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
                <div
                  style={{
                    height: 11,
                    width: "55%",
                    borderRadius: 6,
                    background:
                      "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                    backgroundSize: "800px 100%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (!job)
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Job not found
        </div>
        <Link
          href="/dashboard/jobs"
          style={{
            color: "#7C3AED",
            fontSize: 13,
            marginTop: 8,
            display: "inline-block",
          }}
        >
          ← Back to Jobs
        </Link>
      </div>
    );

  const jobStatusCfg = {
    active: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", label: "Active" },
    draft: { color: "#d97706", bg: "rgba(245,158,11,0.1)", label: "Draft" },
    closed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Closed" },
  }[job.status];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }

        .jd-page {
          min-height:100%; background:#f8fafc;
          padding:28px 32px 60px;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          from { background-position:-400px 0; }
          to   { background-position:400px 0; }
        }
        .reveal { animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
        .r1{animation-delay:.04s} .r2{animation-delay:.10s}
        .r3{animation-delay:.16s} .r4{animation-delay:.22s}
        .r5{animation-delay:.28s}

        /* ── Back ── */
        .back-link {
          display:inline-flex; align-items:center; gap:7px;
          font-size:13px; font-weight:600; color:#64748b;
          text-decoration:none; margin-bottom:18px; transition:color .18s;
        }
        .back-link:hover { color:#7C3AED; }

        /* ── Job header card ── */
        .job-header-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:16px;
          padding:22px 24px; margin-bottom:20px;
          display:flex; align-items:flex-start; gap:18px; flex-wrap:wrap;
        }
        .job-header-icon {
          width:52px; height:52px; border-radius:14px;
          background:rgba(124,58,237,.1);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .job-header-info { flex:1; min-width:0; }
        .job-header-title {
          font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-.4px;
          margin-bottom:6px;
        }
        .job-header-meta {
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        }
        .jh-chip {
          display:flex; align-items:center; gap:5px;
          font-size:12px; color:#64748b; font-weight:500;
        }
        .meta-sep { width:3px; height:3px; border-radius:50%; background:#cbd5e1; }
        .status-pill {
          display:inline-flex; align-items:center; gap:5px;
          font-size:11px; font-weight:700; padding:4px 11px; border-radius:20px;
        }
        .job-header-actions {
          display:flex; gap:10px; align-items:center; flex-shrink:0; flex-wrap:wrap;
        }

        /* ── Buttons ── */
        .btn-primary {
          display:flex; align-items:center; gap:7px; padding:9px 18px;
          border-radius:10px; background:linear-gradient(135deg,#7C3AED,#5b21b6);
          border:none; font-size:13px; font-weight:700; color:#fff;
          cursor:pointer; text-decoration:none;
          box-shadow:0 4px 12px rgba(124,58,237,.28);
          transition:transform .18s, box-shadow .18s;
          font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap;
        }
        .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,.36); }
        .btn-outline {
          display:flex; align-items:center; gap:7px; padding:9px 16px;
          border-radius:10px; border:1.5px solid #e2e8f0; background:#fff;
          font-size:13px; font-weight:600; color:#374151; cursor:pointer;
          text-decoration:none; transition:all .18s; white-space:nowrap;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-outline:hover { border-color:#7C3AED; color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08); }
        .btn-outline.copied { border-color:#22c55e; color:#16a34a; }

        /* ── Stats row ── */
        .stats-row {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:14px; margin-bottom:20px;
        }
        .stat-mini {
          background:#fff; border:1px solid #e2e8f0; border-radius:12px;
          padding:16px 18px; display:flex; align-items:center; gap:12px;
        }
        .sm-icon {
          width:36px; height:36px; border-radius:10px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .sm-val { font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-.5px; }
        .sm-lbl { font-size:11px; color:#64748b; font-weight:500; margin-top:1px; }

        /* ── Toolbar ── */
        .toolbar {
          display:flex; align-items:center; gap:10px;
          margin-bottom:16px; flex-wrap:wrap;
        }
        .search-wrap { position:relative; flex:1; min-width:180px; max-width:300px; }
        .search-ico  { position:absolute; left:11px; top:50%; transform:translateY(-50%); pointer-events:none; }
        .search-inp  {
          width:100%; padding:8px 12px 8px 34px;
          border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:13px; font-family:'Plus Jakarta Sans',sans-serif;
          color:#0f172a; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .search-inp::placeholder { color:#94a3b8; }
        .search-inp:focus { border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08); }

        .filter-sel {
          padding:8px 30px 8px 12px; border:1.5px solid #e2e8f0;
          border-radius:10px; font-size:12px; font-weight:600;
          font-family:'Plus Jakarta Sans',sans-serif; color:#374151;
          background:#fff; outline:none; cursor:pointer; appearance:none;
          transition:border-color .2s;
        }
        .filter-sel:focus { border-color:#7C3AED; }
        .sel-wrap { position:relative; }
        .sel-arr  { position:absolute; right:9px; top:50%; transform:translateY(-50%); pointer-events:none; }

        .sort-btn {
          display:flex; align-items:center; gap:6px; padding:8px 14px;
          border:1.5px solid #e2e8f0; border-radius:10px; background:#fff;
          font-size:12px; font-weight:600; color:#374151; cursor:pointer;
          transition:all .18s; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .sort-btn.active { border-color:#7C3AED; color:#7C3AED; background:rgba(124,58,237,.06); }

        /* ── Candidate card ── */
        .candidate-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:14px;
          margin-bottom:10px; overflow:hidden;
          transition:box-shadow .2s, transform .18s;
        }
        .candidate-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.07); transform:translateY(-1px); }

        .candidate-row {
          display:flex; align-items:center; gap:14px;
          padding:14px 18px; cursor:pointer;
        }

        /* avatar */
        .c-avatar {
          width:42px; height:42px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:800; flex-shrink:0;
        }

        /* rank badge */
        .rank-badge {
          position:absolute; top:-4px; right:-4px;
          width:18px; height:18px; border-radius:50%;
          background:#f59e0b; color:#fff;
          font-size:9px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          border:2px solid #fff;
        }
        .avatar-wrap { position:relative; flex-shrink:0; }

        .c-info { flex:1; min-width:0; }
        .c-name {
          font-size:14px; font-weight:700; color:#0f172a;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .c-meta {
          display:flex; align-items:center; gap:7px; margin-top:3px; flex-wrap:wrap;
        }
        .c-meta-item { font-size:11px; color:#64748b; font-weight:500; }
        .c-dot { width:3px; height:3px; border-radius:50%; background:#cbd5e1; flex-shrink:0; }

        /* score ring */
        .score-wrap {
          display:flex; flex-direction:column; align-items:center; gap:3px;
          min-width:56px;
        }
        .score-ring {
          width:48px; height:48px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:800; border:3px solid;
          flex-shrink:0;
        }
        .score-label { font-size:10px; font-weight:700; }

        /* status + actions */
        .c-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .c-status {
          font-size:11px; font-weight:600; padding:4px 10px;
          border-radius:20px; white-space:nowrap;
        }
        .expand-btn {
          width:30px; height:30px; border-radius:8px;
          border:1.5px solid #e2e8f0; background:#fff;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:border-color .2s;
        }
        .expand-btn:hover { border-color:#7C3AED; }

        .menu-wrap { position:relative; }
        .menu-trigger {
          width:30px; height:30px; border-radius:8px;
          border:1.5px solid #e2e8f0; background:#fff;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:border-color .2s;
        }
        .menu-trigger:hover { border-color:#7C3AED; }
        .dropdown {
          position:absolute; right:0; top:calc(100% + 6px);
          background:#fff; border:1px solid #e2e8f0; border-radius:12px;
          padding:6px; box-shadow:0 10px 40px rgba(0,0,0,.12);
          min-width:170px; z-index:50;
        }
        .drop-item {
          display:flex; align-items:center; gap:9px;
          padding:9px 12px; border-radius:8px; font-size:13px; font-weight:500;
          color:#374151; cursor:pointer; transition:background .15s; white-space:nowrap;
        }
        .drop-item:hover { background:#f8fafc; color:#0f172a; }
        .drop-item.danger { color:#ef4444; }
        .drop-item.danger:hover { background:rgba(239,68,68,.06); }
        .drop-divider { height:1px; background:#f1f5f9; margin:4px 0; }

        /* ── Expanded AI panel ── */
        .ai-panel {
          border-top:1px solid #f1f5f9; padding:18px 20px;
          background:linear-gradient(135deg,rgba(124,58,237,.02),rgba(91,33,182,.01));
          animation:fadeUp .28s cubic-bezier(.22,1,.36,1);
        }
        .ai-panel-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .ai-section-title {
          font-size:11px; font-weight:700; color:#7C3AED;
          text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px;
          display:flex; align-items:center; gap:6px;
        }
        .ai-summary {
          font-size:13px; color:#374151; line-height:1.6;
          background:rgba(124,58,237,.04); border:1px solid rgba(124,58,237,.1);
          border-radius:10px; padding:12px 14px; margin-bottom:14px;
        }
        .ai-list { display:flex; flex-direction:column; gap:6px; }
        .ai-list-item {
          display:flex; align-items:flex-start; gap:8px;
          font-size:12px; color:#374151; line-height:1.45;
        }
        .ai-list-dot {
          width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:4px;
        }
        .ai-actions {
          display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;
        }
        .ai-btn {
          display:flex; align-items:center; gap:6px; padding:8px 14px;
          border-radius:9px; font-size:12px; font-weight:600;
          cursor:pointer; transition:all .18s; white-space:nowrap;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .ai-btn.shortlist {
          background:rgba(34,197,94,.1); color:#16a34a; border:1.5px solid rgba(34,197,94,.25);
        }
        .ai-btn.shortlist:hover { background:rgba(34,197,94,.18); }
        .ai-btn.reject {
          background:rgba(239,68,68,.08); color:#ef4444; border:1.5px solid rgba(239,68,68,.2);
        }
        .ai-btn.reject:hover { background:rgba(239,68,68,.14); }
        .ai-btn.view {
          background:#f8fafc; color:#374151; border:1.5px solid #e2e8f0;
        }
        .ai-btn.view:hover { border-color:#7C3AED; color:#7C3AED; }

        /* pending screening badge */
        .pending-badge {
          display:inline-flex; align-items:center; gap:5px;
          font-size:11px; font-weight:600; color:#94a3b8;
          background:#f8fafc; border:1px solid #e2e8f0;
          padding:4px 10px; border-radius:20px;
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spinning { animation:spin 1.2s linear infinite; }

        /* ── Empty ── */
        .empty-state {
          background:#fff; border:1px dashed #e2e8f0; border-radius:16px;
          padding:52px 24px; text-align:center;
        }
        .empty-icon {
          width:56px; height:56px; border-radius:14px; background:rgba(124,58,237,.08);
          display:flex; align-items:center; justify-content:center; margin:0 auto 14px;
        }
        .empty-title { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:6px; }
        .empty-sub   { font-size:13px; color:#94a3b8; margin-bottom:18px; }

        /* ── Skills strip ── */
        .skills-strip { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .skill-chip {
          padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600;
          background:rgba(124,58,237,.08); color:#7C3AED;
        }

        /* ── Responsive ── */
        @media (max-width:900px) {
          .stats-row { grid-template-columns:repeat(2,1fr); }
          .ai-panel-grid { grid-template-columns:1fr; }
        }
        @media (max-width:640px) {
          .jd-page { padding:20px 16px 48px; }
          .stats-row { grid-template-columns:repeat(2,1fr); gap:10px; }
          .job-header-actions { width:100%; }
          .score-wrap { display:none; }
        }
      `}</style>

      <div className="jd-page" onClick={() => setOpenMenu(null)}>
        {/* ── Back ── */}
        <Link href="/dashboard/jobs" className="back-link reveal r1">
          <ArrowLeft size={15} /> Back to Jobs
        </Link>

        {/* ── Job header ── */}
        <div className="job-header-card reveal r1">
          <div className="job-header-icon">
            <Briefcase size={22} color="#7C3AED" />
          </div>

          <div className="job-header-info">
            <div className="job-header-title">{job.title}</div>
            <div className="job-header-meta">
              {job.department && (
                <span className="jh-chip">
                  <Briefcase size={12} /> {job.department}
                </span>
              )}
              {job.location && (
                <>
                  <span className="meta-sep" />
                  <span className="jh-chip">
                    <MapPin size={12} /> {job.location}
                  </span>
                </>
              )}
              <span className="meta-sep" />
              <span className="jh-chip">
                <Clock size={12} />{" "}
                {employmentLabels[job.employment_type] ?? "Full-time"}
              </span>
              {job.experience_level && (
                <>
                  <span className="meta-sep" />
                  <span className="jh-chip">
                    <Award size={12} />{" "}
                    {expLabels[job.experience_level] ?? job.experience_level}
                  </span>
                </>
              )}
              <span className="meta-sep" />
              <span className="jh-chip">
                <Clock size={12} /> Posted {timeAgo(job.created_at)}
              </span>
              <span
                className="status-pill"
                style={{
                  color: jobStatusCfg.color,
                  background: jobStatusCfg.bg,
                }}
              >
                {jobStatusCfg.label}
              </span>
            </div>

            {job.skills?.length > 0 && (
              <div className="skills-strip">
                {job.skills.map((s) => (
                  <span key={s} className="skill-chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="job-header-actions">
            <button
              className={`btn-outline${copiedLink ? " copied" : ""}`}
              onClick={handleCopyLink}
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 size={13} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Apply Link
                </>
              )}
            </button>
            <Link
              href={`/dashboard/jobs/${job.id}/upload`}
              className="btn-primary"
            >
              <Upload size={13} /> Upload CVs
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="stats-row reveal r2">
          <div className="stat-mini">
            <div
              className="sm-icon"
              style={{ background: "rgba(124,58,237,.1)" }}
            >
              <Users size={17} color="#7C3AED" />
            </div>
            <div>
              <div className="sm-val">{candidates.length}</div>
              <div className="sm-lbl">Total Candidates</div>
            </div>
          </div>
          <div className="stat-mini">
            <div
              className="sm-icon"
              style={{ background: "rgba(34,197,94,.1)" }}
            >
              <Zap size={17} color="#22c55e" />
            </div>
            <div>
              <div className="sm-val">{screened}</div>
              <div className="sm-lbl">AI Screened</div>
            </div>
          </div>
          <div className="stat-mini">
            <div
              className="sm-icon"
              style={{ background: "rgba(245,158,11,.1)" }}
            >
              <Star size={17} color="#f59e0b" />
            </div>
            <div>
              <div className="sm-val">{shortlisted}</div>
              <div className="sm-lbl">Shortlisted</div>
            </div>
          </div>
          <div className="stat-mini">
            <div
              className="sm-icon"
              style={{ background: "rgba(59,130,246,.1)" }}
            >
              <TrendingUp size={17} color="#3b82f6" />
            </div>
            <div>
              <div className="sm-val">{avgScore ?? "—"}</div>
              <div className="sm-lbl">Avg AI Score</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar reveal r3">
          <div className="search-wrap">
            <Search size={14} color="#94a3b8" className="search-ico" />
            <input
              className="search-inp"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Score filter */}
          <div className="sel-wrap">
            <select
              className="filter-sel"
              value={scoreFilter}
              onChange={(e) =>
                setScoreFilter(e.target.value as typeof scoreFilter)
              }
            >
              <option value="all">All Scores</option>
              <option value="strong">Strong (80+)</option>
              <option value="good">Good (60–79)</option>
              <option value="fair">Fair (40–59)</option>
              <option value="weak">Weak (&lt;40)</option>
            </select>
            <ChevronDown size={13} color="#94a3b8" className="sel-arr" />
          </div>

          {/* Status filter */}
          <div className="sel-wrap">
            <select
              className="filter-sel"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown size={13} color="#94a3b8" className="sel-arr" />
          </div>

          {/* Sort */}
          <button
            className={`sort-btn${sortBy === "score" ? " active" : ""}`}
            onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}
          >
            <TrendingUp size={13} />
            {sortBy === "score" ? "By Score" : "By Date"}
          </button>

          {/* Export */}
          <button className="btn-outline" style={{ marginLeft: "auto" }}>
            <Download size={13} /> Export
          </button>
        </div>

        {/* ── Candidate list ── */}
        <div className="reveal r4">
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <Users size={24} color="#7C3AED" />
              </div>
              <div className="empty-title">
                {candidates.length === 0
                  ? "No candidates yet"
                  : "No candidates match your filters"}
              </div>
              <div className="empty-sub">
                {candidates.length === 0
                  ? "Upload CVs manually or share the apply link to start collecting applications."
                  : "Try adjusting your search or filter criteria."}
              </div>
              {candidates.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/dashboard/jobs/${job.id}/upload`}
                    className="btn-primary"
                  >
                    <Upload size={13} /> Upload CVs
                  </Link>
                  <button className="btn-outline" onClick={handleCopyLink}>
                    <Copy size={13} /> Copy Apply Link
                  </button>
                </div>
              )}
            </div>
          )}

          {filtered.map((candidate, index) => {
            const sc = scoreColor(candidate.ai_score);
            const stCfg = candidateStatusConfig[candidate.status];
            const [fg, bg] = avatarColor(candidate.candidate_name);
            const isExpanded = expandedId === candidate.id;
            const rank =
              sortBy === "score" && candidate.ai_score
                ? candidates.filter(
                    (c) => (c.ai_score ?? 0) > (candidate.ai_score ?? 0),
                  ).length + 1
                : null;

            return (
              <div key={candidate.id} className="candidate-card">
                {/* ── Row ── */}
                <div
                  className="candidate-row"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : candidate.id)
                  }
                >
                  {/* Avatar */}
                  <div className="avatar-wrap">
                    <div
                      className="c-avatar"
                      style={{ background: bg, color: fg }}
                    >
                      {initials(candidate.candidate_name)}
                    </div>
                    {rank && rank <= 3 && (
                      <div
                        className="rank-badge"
                        style={{
                          background:
                            rank === 1
                              ? "#f59e0b"
                              : rank === 2
                                ? "#94a3b8"
                                : "#b45309",
                        }}
                      >
                        {rank}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="c-info">
                    <div className="c-name">{candidate.candidate_name}</div>
                    <div className="c-meta">
                      <span className="c-meta-item">
                        {candidate.candidate_email}
                      </span>
                      {candidate.university && (
                        <>
                          <span className="c-dot" />
                          <span className="c-meta-item">
                            {candidate.university}
                          </span>
                        </>
                      )}
                      {candidate.years_experience != null && (
                        <>
                          <span className="c-dot" />
                          <span className="c-meta-item">
                            {candidate.years_experience}y exp
                          </span>
                        </>
                      )}
                      <span className="c-dot" />
                      <span className="c-meta-item">
                        {timeAgo(candidate.applied_at)}
                      </span>
                      {candidate.source === "apply_link" && (
                        <>
                          <span className="c-dot" />
                          <span
                            className="c-meta-item"
                            style={{ color: "#7C3AED" }}
                          >
                            Applied online
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score ring */}
                  <div className="score-wrap">
                    {candidate.screening_status === "completed" &&
                    candidate.ai_score != null ? (
                      <>
                        <div
                          className="score-ring"
                          style={{
                            borderColor: sc.color,
                            color: sc.color,
                            background: sc.bg,
                          }}
                        >
                          {candidate.ai_score}
                        </div>
                        <span
                          className="score-label"
                          style={{ color: sc.color }}
                        >
                          {sc.label}
                        </span>
                      </>
                    ) : candidate.screening_status === "processing" ? (
                      <span className="pending-badge">
                        <RefreshCw size={11} className="spinning" /> Screening
                      </span>
                    ) : (
                      <span className="pending-badge">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                  </div>

                  {/* Right: status + actions */}
                  <div className="c-right" onClick={(e) => e.stopPropagation()}>
                    <span
                      className="c-status"
                      style={{ color: stCfg.color, background: stCfg.bg }}
                    >
                      {stCfg.label}
                    </span>

                    {/* Expand */}
                    <button
                      className="expand-btn"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : candidate.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} color="#64748b" />
                      ) : (
                        <ChevronDown size={14} color="#64748b" />
                      )}
                    </button>

                    {/* 3-dot */}
                    <div className="menu-wrap">
                      <button
                        className="menu-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(
                            openMenu === candidate.id ? null : candidate.id,
                          );
                        }}
                      >
                        <MoreVertical size={14} color="#64748b" />
                      </button>
                      {openMenu === candidate.id && (
                        <div
                          className="dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={candidate.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="drop-item"
                            onClick={() => setOpenMenu(null)}
                          >
                            <ExternalLink size={13} /> View CV
                          </a>
                          <div className="drop-divider" />
                          <div
                            className="drop-item"
                            style={{ color: "#16a34a" }}
                            onClick={() =>
                              handleStatusChange(candidate.id, "shortlisted")
                            }
                          >
                            <CheckCircle2 size={13} color="#16a34a" /> Shortlist
                          </div>
                          <div
                            className="drop-item"
                            onClick={() =>
                              handleStatusChange(candidate.id, "reviewing")
                            }
                          >
                            <Eye size={13} /> Mark Reviewing
                          </div>
                          <div
                            className="drop-item danger"
                            onClick={() =>
                              handleStatusChange(candidate.id, "rejected")
                            }
                          >
                            <XCircle size={13} /> Reject
                          </div>
                          <div className="drop-divider" />
                          <div
                            className="drop-item danger"
                            onClick={() => handleDelete(candidate.id)}
                          >
                            <Trash2 size={13} /> Remove
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Expanded AI panel ── */}
                {isExpanded && candidate.screening_status === "completed" && (
                  <div className="ai-panel">
                    {/* Summary */}
                    {candidate.ai_summary && (
                      <>
                        <div className="ai-section-title">
                          <Zap size={12} /> AI Summary
                        </div>
                        <div className="ai-summary">{candidate.ai_summary}</div>
                      </>
                    )}

                    <div className="ai-panel-grid">
                      {/* Strengths */}
                      {candidate.ai_strengths &&
                        candidate.ai_strengths.length > 0 && (
                          <div>
                            <div
                              className="ai-section-title"
                              style={{ color: "#16a34a" }}
                            >
                              <CheckCircle2 size={12} /> Strengths
                            </div>
                            <div className="ai-list">
                              {candidate.ai_strengths.map((s, i) => (
                                <div key={i} className="ai-list-item">
                                  <div
                                    className="ai-list-dot"
                                    style={{ background: "#22c55e" }}
                                  />
                                  {s}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Red flags */}
                      {candidate.ai_red_flags &&
                        candidate.ai_red_flags.length > 0 && (
                          <div>
                            <div
                              className="ai-section-title"
                              style={{ color: "#ef4444" }}
                            >
                              <AlertTriangle size={12} /> Red Flags
                            </div>
                            <div className="ai-list">
                              {candidate.ai_red_flags.map((f, i) => (
                                <div key={i} className="ai-list-item">
                                  <div
                                    className="ai-list-dot"
                                    style={{ background: "#ef4444" }}
                                  />
                                  {f}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Justification */}
                    {candidate.ai_justification && (
                      <div style={{ marginTop: 14 }}>
                        <div className="ai-section-title">
                          <Target size={12} /> Score Justification
                        </div>
                        <div className="ai-summary" style={{ marginBottom: 0 }}>
                          {candidate.ai_justification}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="ai-actions">
                      {candidate.status !== "shortlisted" && (
                        <button
                          className="ai-btn shortlist"
                          onClick={() =>
                            handleStatusChange(candidate.id, "shortlisted")
                          }
                          disabled={updatingId === candidate.id}
                        >
                          <CheckCircle2 size={13} />
                          {updatingId === candidate.id
                            ? "Saving..."
                            : "Shortlist Candidate"}
                        </button>
                      )}
                      {candidate.status !== "rejected" && (
                        <button
                          className="ai-btn reject"
                          onClick={() =>
                            handleStatusChange(candidate.id, "rejected")
                          }
                          disabled={updatingId === candidate.id}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                      <a
                        href={candidate.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ai-btn view"
                      >
                        <ExternalLink size={13} /> View Full CV
                      </a>
                    </div>
                  </div>
                )}

                {/* Pending screening message */}
                {isExpanded && candidate.screening_status === "pending" && (
                  <div
                    className="ai-panel"
                    style={{ textAlign: "center", padding: "24px 20px" }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      ⏳ This CV is queued for AI screening. Results will appear
                      shortly.
                    </div>
                  </div>
                )}

                {/* Processing */}
                {isExpanded && candidate.screening_status === "processing" && (
                  <div
                    className="ai-panel"
                    style={{ textAlign: "center", padding: "24px 20px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "#7C3AED",
                        fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={14} className="spinning" /> AI is
                      screening this CV...
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

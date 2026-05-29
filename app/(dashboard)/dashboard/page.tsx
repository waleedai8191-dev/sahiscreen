import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requireAuth,
  getUserProfile,
  getSubscriptionStatus,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Upload,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  Target,
  BarChart3,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecentJob {
  id: string;
  title: string;
  department: string;
  candidates_count: number;
  screened_count: number;
  status: "active" | "closed" | "draft";
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: "screening_done" | "job_created" | "candidate_added" | "plan_upgraded";
  message: string;
  time: string;
  icon: "check" | "briefcase" | "user" | "zap";
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getDashboardData(companyId: string) {
  const supabase = await createSupabaseServerClient();

  const [jobsResult, candidatesResult, screeningsResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, department, status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("candidates")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    supabase
      .from("screening_results")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
  ]);

  const jobs = (jobsResult.data ?? []) as RecentJob[];
  const totalCandidates = candidatesResult.count ?? 0;
  const totalScreenings = screeningsResult.count ?? 0;
  const activeJobs = jobs.filter((j) => j.status === "active").length;

  return { jobs, totalCandidates, totalScreenings, activeJobs };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const statusConfig = {
  active: { label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  closed: { label: "Closed", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  draft: { label: "Draft", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

// ─── Mock activity (replace with real DB query) ───────────────────────────────

const mockActivity: ActivityItem[] = [
  {
    id: "1",
    type: "screening_done",
    message: "AI screened 42 CVs for Senior Engineer",
    time: "2 hours ago",
    icon: "check",
  },
  {
    id: "2",
    type: "job_created",
    message: "New job posted: Marketing Manager",
    time: "5 hours ago",
    icon: "briefcase",
  },
  {
    id: "3",
    type: "candidate_added",
    message: "18 candidates added to Product Designer role",
    time: "Yesterday",
    icon: "user",
  },
  {
    id: "4",
    type: "screening_done",
    message: "AI screened 67 CVs for Finance Analyst",
    time: "2 days ago",
    icon: "check",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireAuth();
  if (!session) redirect("/login");

  const [profile, subscription] = await Promise.all([
    getUserProfile(session.id),
    getSubscriptionStatus(session.id),
  ]);

  const companyId = profile?.company_id ?? "";
  const { jobs, totalCandidates, totalScreenings, activeJobs } =
    await getDashboardData(companyId);

  const firstName = (profile?.full_name ?? "there").split(" ")[0];
  const usagePercent = subscription
    ? Math.min(
        (subscription.cvs_used_this_month / subscription.cv_limit) * 100,
        100,
      )
    : 0;
  const isPremium = subscription?.plan === "premium";
  const isTrial = subscription?.plan === "trial";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .dash-page {
          min-height: 100%;
          background: #f8fafc;
          padding: 28px 32px 48px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Stagger reveal ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .reveal-1 { animation-delay: 0.05s; }
        .reveal-2 { animation-delay: 0.12s; }
        .reveal-3 { animation-delay: 0.19s; }
        .reveal-4 { animation-delay: 0.26s; }
        .reveal-5 { animation-delay: 0.33s; }
        .reveal-6 { animation-delay: 0.40s; }

        /* ── Page header ── */
        .page-header {
          margin-bottom: 28px;
        }
        .greeting-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .greeting-text {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .greeting-sub {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }
        .header-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }
        .btn-outline {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-outline:hover {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
          color: #7C3AED;
        }
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          border: none;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
          transition: transform 0.18s, box-shadow 0.18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(124,58,237,0.38);
        }

        /* ── Trial banner ── */
        .trial-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 18px;
          background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(91,33,182,0.05));
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .trial-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .trial-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg,#7C3AED,#5b21b6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .trial-text-title {
          font-size: 13px;
          font-weight: 700;
          color: #5b21b6;
        }
        .trial-text-sub {
          font-size: 12px;
          color: #7C3AED;
          margin-top: 1px;
        }
        .trial-upgrade-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          text-decoration: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
        .trial-upgrade-btn:hover { transform: translateY(-1px); }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .stat-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 14px 14px 0 0;
        }
        .stat-card.purple::before { background: linear-gradient(90deg,#7C3AED,#a78bfa); }
        .stat-card.blue::before   { background: linear-gradient(90deg,#3b82f6,#93c5fd); }
        .stat-card.green::before  { background: linear-gradient(90deg,#22c55e,#86efac); }
        .stat-card.amber::before  { background: linear-gradient(90deg,#f59e0b,#fcd34d); }

        .stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-wrap.purple { background: rgba(124,58,237,0.1); }
        .stat-icon-wrap.blue   { background: rgba(59,130,246,0.1); }
        .stat-icon-wrap.green  { background: rgba(34,197,94,0.1);  }
        .stat-icon-wrap.amber  { background: rgba(245,158,11,0.1); }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 7px;
          border-radius: 20px;
        }
        .stat-trend.up   { color: #16a34a; background: rgba(34,197,94,0.1); }
        .stat-trend.flat { color: #64748b; background: rgba(100,116,139,0.1); }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        /* ── Usage bar inside stat ── */
        .usage-bar-wrap {
          margin-top: 12px;
        }
        .usage-bar-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .usage-bar-label {
          font-size: 11px;
          color: #94a3b8;
        }
        .usage-bar-pct {
          font-size: 11px;
          font-weight: 700;
        }
        .ubar-track {
          height: 5px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }
        .ubar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
        }

        /* ── Main grid ── */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
        }

        /* ── Card shared ── */
        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        .card-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .card-subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 1px;
        }
        .card-link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          text-decoration: none;
        }
        .card-link:hover { text-decoration: underline; }

        /* ── Job rows ── */
        .job-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.15s;
          text-decoration: none;
        }
        .job-row:last-child { border-bottom: none; }
        .job-row:hover { background: #f8fafc; }

        .job-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(124,58,237,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .job-info { flex: 1; min-width: 0; }
        .job-title-text {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .job-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 3px;
        }
        .job-dept {
          font-size: 11px;
          color: #94a3b8;
        }
        .job-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #cbd5e1;
          flex-shrink: 0;
        }
        .job-candidates {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .job-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
        }

        /* progress ring inside job row */
        .screen-ring-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .screen-pct {
          font-size: 11px;
          font-weight: 700;
          color: #7C3AED;
        }

        /* ── Empty state ── */
        .empty-state {
          padding: 40px 20px;
          text-align: center;
        }
        .empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(124,58,237,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }
        .empty-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .empty-sub {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 16px;
        }

        /* ── Right column ── */
        .right-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Quick actions ── */
        .quick-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.18s;
          margin: 0 16px;
        }
        .quick-action:not(:last-child) { margin-bottom: 8px; }
        .quick-action:last-child { margin-bottom: 16px; }
        .quick-action:hover {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
          transform: translateX(3px);
        }
        .qa-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qa-icon.purple { background: rgba(124,58,237,0.1); }
        .qa-icon.blue   { background: rgba(59,130,246,0.1); }
        .qa-icon.green  { background: rgba(34,197,94,0.1); }
        .qa-text { flex: 1; }
        .qa-label {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }
        .qa-sub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        /* ── Activity feed ── */
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
        }
        .activity-item:not(:last-child) {
          border-bottom: 1px solid #f8fafc;
        }
        .act-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .act-icon.check     { background: rgba(34,197,94,0.1);  }
        .act-icon.briefcase { background: rgba(59,130,246,0.1); }
        .act-icon.user      { background: rgba(245,158,11,0.1); }
        .act-icon.zap       { background: rgba(124,58,237,0.1); }
        .act-msg {
          font-size: 12px;
          color: #374151;
          font-weight: 500;
          line-height: 1.45;
        }
        .act-time {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 3px;
        }

        /* ── AI tip card ── */
        .ai-tip-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          border-radius: 14px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .ai-tip-glow {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(124,58,237,0.3);
          filter: blur(40px);
          top: -20px;
          right: -20px;
          pointer-events: none;
        }
        .ai-tip-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(124,58,237,0.25);
          border: 1px solid rgba(124,58,237,0.35);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 10px;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }
        .ai-tip-title {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 6px;
        }
        .ai-tip-body {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.55;
          margin-bottom: 14px;
        }
        .ai-tip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(124,58,237,0.25);
          border: 1px solid rgba(124,58,237,0.4);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #a78bfa;
          text-decoration: none;
          transition: background 0.2s;
        }
        .ai-tip-btn:hover { background: rgba(124,58,237,0.4); }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .main-grid  { grid-template-columns: 1fr; }
          .right-col  { flex-direction: row; flex-wrap: wrap; }
          .right-col > * { flex: 1 1 280px; }
        }
        @media (max-width: 640px) {
          .dash-page  { padding: 20px 16px 40px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .stat-value { font-size: 22px; }
          .greeting-text { font-size: 20px; }
          .header-actions .btn-outline { display: none; }
          .right-col { flex-direction: column; }
        }
      `}</style>

      <div className="dash-page">
        {/* ── Trial / Expired Banner ── */}
        {isTrial && subscription && (
          <div className="trial-banner reveal reveal-1">
            <div className="trial-banner-left">
              <div className="trial-icon">
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div className="trial-text-title">
                  Free Trial — {subscription.cv_limit ?? 14} days remaining
                </div>
                <div className="trial-text-sub">
                  {subscription.cvs_used_this_month} CV screenings left ·
                  Upgrade to unlock unlimited access
                </div>
              </div>
            </div>
            <Link href="/dashboard/billing" className="trial-upgrade-btn">
              <Zap size={13} /> Upgrade Now
            </Link>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="page-header reveal reveal-1">
          <div className="greeting-row">
            <div>
              <div className="greeting-text">
                {greeting}, {firstName} 👋
              </div>
              <div className="greeting-sub">
                Here&apos;s what&apos;s happening with your hiring pipeline
                today.
              </div>
            </div>
            <div className="header-actions">
              <Link href="/dashboard/candidates" className="btn-outline">
                <Upload size={14} /> Upload CVs
              </Link>
              <Link href="/dashboard/jobs/new" className="btn-primary">
                <Plus size={14} /> Post a Job
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="stats-grid reveal reveal-2">
          {/* Active jobs */}
          <div className="stat-card purple">
            <div className="stat-top">
              <div className="stat-icon-wrap purple">
                <Briefcase size={18} color="#7C3AED" />
              </div>
              <span className="stat-trend up">
                <TrendingUp size={10} /> Live
              </span>
            </div>
            <div className="stat-value">{activeJobs}</div>
            <div className="stat-label">Active Jobs</div>
          </div>

          {/* Total candidates */}
          <div className="stat-card blue">
            <div className="stat-top">
              <div className="stat-icon-wrap blue">
                <Users size={18} color="#3b82f6" />
              </div>
              <span className="stat-trend up">
                <TrendingUp size={10} /> +12%
              </span>
            </div>
            <div className="stat-value">{totalCandidates}</div>
            <div className="stat-label">Total Candidates</div>
          </div>

          {/* Screenings done */}
          <div className="stat-card green">
            <div className="stat-top">
              <div className="stat-icon-wrap green">
                <Target size={18} color="#22c55e" />
              </div>
              <span className="stat-trend up">
                <TrendingUp size={10} /> +8%
              </span>
            </div>
            <div className="stat-value">{totalScreenings}</div>
            <div className="stat-label">AI Screenings Done</div>
          </div>

          {/* CV usage */}
          <div className="stat-card amber">
            <div className="stat-top">
              <div className="stat-icon-wrap amber">
                <BarChart3 size={18} color="#f59e0b" />
              </div>
              <span
                className="stat-trend"
                style={{
                  color: usagePercent >= 90 ? "#ef4444" : "#64748b",
                  background:
                    usagePercent >= 90
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(100,116,139,0.1)",
                }}
              >
                {Math.round(usagePercent)}%
              </span>
            </div>
            <div className="stat-value">
              {subscription?.cvs_used_this_month ?? 0}
            </div>
            <div className="stat-label">CVs Screened This Period</div>
            <div className="usage-bar-wrap">
              <div className="usage-bar-row">
                <span className="usage-bar-label">
                  of {subscription?.cv_limit ?? 0} limit
                </span>
                <span
                  className="usage-bar-pct"
                  style={{
                    color:
                      usagePercent >= 90
                        ? "#ef4444"
                        : usagePercent >= 75
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                >
                  {Math.round(usagePercent)}% used
                </span>
              </div>
              <div className="ubar-track">
                <div
                  className="ubar-fill"
                  style={{
                    width: `${usagePercent}%`,
                    background:
                      usagePercent >= 90
                        ? "#ef4444"
                        : usagePercent >= 75
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="main-grid">
          {/* ── Left: Recent Jobs ── */}
          <div className="reveal reveal-3">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Jobs</div>
                  <div className="card-subtitle">
                    Your latest job postings and screening progress
                  </div>
                </div>
                <Link href="/dashboard/jobs" className="card-link">
                  View all <ChevronRight size={13} />
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Briefcase size={22} color="#7C3AED" />
                  </div>
                  <div className="empty-title">No jobs yet</div>
                  <div className="empty-sub">
                    Post your first job to start screening candidates with AI.
                  </div>
                  <Link href="/dashboard/jobs/new" className="btn-primary">
                    <Plus size={14} /> Post a Job
                  </Link>
                </div>
              ) : (
                jobs.map((job) => {
                  const cfg = statusConfig[job.status];
                  const screenPct =
                    job.candidates_count > 0
                      ? Math.round(
                          (job.screened_count / job.candidates_count) * 100,
                        )
                      : 0;
                  return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="job-row"
                    >
                      <div className="job-icon">
                        <Briefcase size={17} color="#7C3AED" />
                      </div>
                      <div className="job-info">
                        <div className="job-title-text">{job.title}</div>
                        <div className="job-meta">
                          <span className="job-dept">
                            {job.department || "General"}
                          </span>
                          <span className="job-dot" />
                          <span className="job-candidates">
                            {job.candidates_count ?? 0} candidates
                          </span>
                          <span className="job-dot" />
                          <span className="job-candidates">
                            {timeAgo(job.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="job-right">
                        {job.candidates_count > 0 && (
                          <div className="screen-ring-wrap">
                            <span className="screen-pct">{screenPct}%</span>
                          </div>
                        )}
                        <span
                          className="status-badge"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                        <ChevronRight size={14} color="#94a3b8" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="right-col">
            {/* Quick actions */}
            <div className="card reveal reveal-4">
              <div className="card-header">
                <div className="card-title">Quick Actions</div>
              </div>
              <div style={{ paddingTop: "10px" }}>
                <Link href="/dashboard/jobs/new" className="quick-action">
                  <div className="qa-icon purple">
                    <Plus size={16} color="#7C3AED" />
                  </div>
                  <div className="qa-text">
                    <div className="qa-label">Post New Job</div>
                    <div className="qa-sub">Create a job with a JD</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </Link>
                <Link href="/dashboard/candidates" className="quick-action">
                  <div className="qa-icon blue">
                    <Upload size={16} color="#3b82f6" />
                  </div>
                  <div className="qa-text">
                    <div className="qa-label">Bulk Upload CVs</div>
                    <div className="qa-sub">Upload up to 500 CVs at once</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </Link>
                <Link href="/dashboard/candidates" className="quick-action">
                  <div className="qa-icon green">
                    <FileText size={16} color="#22c55e" />
                  </div>
                  <div className="qa-text">
                    <div className="qa-label">View Results</div>
                    <div className="qa-sub">See AI-ranked candidates</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </Link>
              </div>
            </div>

            {/* Activity feed */}
            <div className="card reveal reveal-5">
              <div className="card-header">
                <div>
                  <div className="card-title">Recent Activity</div>
                  <div className="card-subtitle">
                    Latest events on your account
                  </div>
                </div>
              </div>
              {mockActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className={`act-icon ${item.icon}`}>
                    {item.icon === "check" && (
                      <CheckCircle2 size={15} color="#22c55e" />
                    )}
                    {item.icon === "briefcase" && (
                      <Briefcase size={15} color="#3b82f6" />
                    )}
                    {item.icon === "user" && (
                      <Users size={15} color="#f59e0b" />
                    )}
                    {item.icon === "zap" && <Zap size={15} color="#7C3AED" />}
                  </div>
                  <div>
                    <div className="act-msg">{item.message}</div>
                    <div className="act-time">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Tip card */}
            {!isPremium && (
              <div className="ai-tip-card reveal reveal-6">
                <div className="ai-tip-glow" />
                <div className="ai-tip-badge">
                  <Sparkles size={10} /> AI Tip
                </div>
                <div className="ai-tip-title">Unlock Anti-AI Detection</div>
                <div className="ai-tip-body">
                  Premium plan uses Claude 3.5 Sonnet to detect AI-generated
                  CVs, identify LUMS/IBA/NUST graduates, and flag red flags
                  specific to Pakistan&apos;s hiring market.
                </div>
                <Link href="/dashboard/billing" className="ai-tip-btn">
                  <Zap size={12} /> Upgrade to Premium
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

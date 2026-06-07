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
import "../../Style/dashboard.css";

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

const EMPTY_DASHBOARD = {
  jobs: [] as RecentJob[],
  totalCandidates: 0,
  totalScreenings: 0,
  activeJobs: 0,
  activity: [] as ActivityItem[],
  error: false,
};

async function getDashboardData(companyId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const [jobsResult, candidatesResult, screeningsResult, activeJobsResult] =
      await Promise.all([
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
          .from("candidates")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("screening_status", "screened"),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "active"),
      ]);

    // Check if any query failed
    const queryError =
      jobsResult.error ||
      candidatesResult.error ||
      screeningsResult.error ||
      activeJobsResult.error;

    if (queryError) {
      console.error("[getDashboardData] Supabase query failed:", queryError);
      return { ...EMPTY_DASHBOARD, error: true };
    }

    const jobIds = (jobsResult.data ?? []).map((j) => j.id);
    const [perJobTotal, perJobScreened] = await Promise.all([
      supabase.from("candidates").select("job_id").in("job_id", jobIds),
      supabase
        .from("candidates")
        .select("job_id")
        .in("job_id", jobIds)
        .eq("screening_status", "screened"),
    ]);

    const totalByJob: Record<string, number> = {};
    const screenedByJob: Record<string, number> = {};

    for (const row of perJobTotal.data ?? []) {
      totalByJob[row.job_id] = (totalByJob[row.job_id] ?? 0) + 1;
    }
    for (const row of perJobScreened.data ?? []) {
      screenedByJob[row.job_id] = (screenedByJob[row.job_id] ?? 0) + 1;
    }

    const jobs: RecentJob[] = (jobsResult.data ?? []).map((j) => ({
      ...j,
      candidates_count: totalByJob[j.id] ?? 0,
      screened_count: screenedByJob[j.id] ?? 0,
    }));

    // Recent activity: last 8 events across cv_uploads + screening_results
    const [recentCvsResult, recentScreeningsResult] = await Promise.all([
      supabase
        .from("cv_uploads")
        .select("id, candidate_name, job_id, source, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("screening_results")
        .select(
          "id, candidate_id, score, recommendation, created_at, cv_uploads!inner(candidate_name, company_id)",
        )
        .eq("cv_uploads.company_id", companyId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Build unified activity list
    const activityItems: ActivityItem[] = [];

    for (const row of recentCvsResult.data ?? []) {
      activityItems.push({
        id: `cv-${row.id}`,
        type: "candidate_added",
        message: `${row.candidate_name} submitted a CV${row.source === "apply_link" ? " via public link" : ""}`,
        time: timeAgo(row.created_at),
        icon: "user",
      });
    }

    for (const row of (recentScreeningsResult.data ?? []) as any[]) {
      const name = row.cv_uploads?.candidate_name ?? "Candidate";
      const score = row.score ? ` — scored ${row.score}/100` : "";
      const rec = row.recommendation ? ` (${row.recommendation})` : "";
      activityItems.push({
        id: `screening-${row.id}`,
        type: "screening_done",
        message: `AI screened ${name}${score}${rec}`,
        time: timeAgo(row.created_at),
        icon: "check",
      });
    }

    // Sort all by most recent and cap at 8
    activityItems.sort((a, b) => {
      const ta =
        (recentCvsResult.data ?? []).find((r) => `cv-${r.id}` === a.id)
          ?.created_at ??
        (recentScreeningsResult.data ?? ([] as any[])).find(
          (r: any) => `screening-${r.id}` === a.id,
        )?.created_at ??
        "";
      const tb =
        (recentCvsResult.data ?? []).find((r) => `cv-${r.id}` === b.id)
          ?.created_at ??
        (recentScreeningsResult.data ?? ([] as any[])).find(
          (r: any) => `screening-${r.id}` === b.id,
        )?.created_at ??
        "";
      return tb.localeCompare(ta);
    });

    return {
      jobs,
      totalCandidates: candidatesResult.count ?? 0,
      totalScreenings: screeningsResult.count ?? 0,
      activeJobs: activeJobsResult.count ?? 0,
      activity: activityItems.slice(0, 8),
      error: false,
    };
  } catch (err) {
    console.error("[getDashboardData] Unexpected error:", err);
    return { ...EMPTY_DASHBOARD, error: true };
  }
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await requireAuth();
  if (!session) redirect("/login");

  const profile = await getUserProfile(session.id);
  const companyId = profile?.company_id;

  if (!companyId) redirect("/login");

  const subscription = await getSubscriptionStatus(companyId);

  if (!companyId) redirect("/login");
  const {
    jobs,
    totalCandidates,
    totalScreenings,
    activeJobs,
    activity,
    error,
  } = await getDashboardData(companyId);
  {
    error && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "13px 18px",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <AlertCircle size={16} color="#ef4444" />
        <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 500 }}>
          Some dashboard data failed to load. Stats may be incomplete — please
          refresh the page.
        </span>
      </div>
    );
  }

  const firstName = (profile?.full_name ?? "there").split(" ")[0];
  const usagePercent = subscription
    ? Math.min(
        (subscription.cvs_used_this_month / subscription.cv_limit) * 100,
        100,
      )
    : 0;
  const isPremium = subscription?.plan === "premium";
  const isTrial = subscription?.status === "trial";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const daysRemaining = subscription?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <>
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
                  Free Trial — {daysRemaining} days remaining
                </div>
                <div className="trial-text-sub">
                  {subscription.cv_limit - subscription.cvs_used_this_month} CV
                  screenings left · Upgrade to unlock unlimited access
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
            {/* <div className="header-actions">
              <Link href="/dashboard/candidates" className="btn-outline">
                <Upload size={14} /> Upload CVs
              </Link>
              <Link href="/dashboard/jobs/new" className="btn-primary">
                <Plus size={14} /> Post a Job
              </Link>
            </div> */}
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
          {/* <div className="stat-card blue">
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
          </div> */}

          {/* Screenings done */}
          {/* <div className="stat-card green">
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
          </div> */}

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
                          {/* <span className="job-dot" /> */}
                          {/* <span className="job-candidates">
                            {job.candidates_count ?? 0} candidates
                          </span> */}
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
                <Link href="/dashboard/screening/new" className="quick-action">
                  <div className="qa-icon blue">
                    <Upload size={16} color="#3b82f6" />
                  </div>
                  <div className="qa-text">
                    <div className="qa-label">Bulk Upload CVs</div>
                    <div className="qa-sub">Upload up to 500 CVs at once</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </Link>

                <Link href="/dashboard/screening" className="quick-action">
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
              {(activity.length > 0 ? activity : []).map((item) => (
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

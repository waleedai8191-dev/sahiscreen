export type NotifType = "success" | "warning" | "info" | "error";

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string; // relative label e.g. "2 min ago"
  read: boolean;
  createdAt: Date;
}

// ── Map a cv_uploads row → notification ─────────────────────────────────────
// Called when INSERT fires on cv_uploads (new public apply submission)
export function cvSubmittedNotif(row: {
  id: string;
  candidate_name: string;
  original_filename: string | null;
  created_at: string;
  job_id: string;
}): AppNotification {
  return {
    id: `cv-${row.id}`,
    type: "info",
    title: "New CV submitted",
    message: `${row.candidate_name} applied via public link.`,
    time: "Just now",
    read: false,
    createdAt: new Date(row.created_at),
  };
}

// ── Map a screening_results row → notification ───────────────────────────────
// Called when screening_status = 'completed' fires
export function screeningCompleteNotif(
  row: {
    id: string;
    candidate_id: string;
    score: number | null;
    recommendation: string | null;
    screened_at: string | null;
    created_at: string;
  },
  candidateName: string,
): AppNotification {
  const score = row.score ?? 0;
  const rec = row.recommendation ?? "review";
  return {
    id: `screening-${row.id}`,
    type: "success",
    title: "Screening complete",
    message: `${candidateName} scored ${score}/100 — ${rec}.`,
    time: "Just now",
    read: false,
    createdAt: new Date(row.screened_at ?? row.created_at),
  };
}

// ── Usage warning ────────────────────────────────────────────────────────────
export function usageWarningNotif(
  current: number,
  limit: number,
): AppNotification {
  const pct = Math.round((current / limit) * 100);
  const at100 = current >= limit;
  return {
    id: `usage-${current}`,
    type: at100 ? "error" : "warning",
    title: at100 ? "CV limit reached" : "Usage at 80%",
    message: at100
      ? `You've used all ${limit.toLocaleString()} monthly CV screenings. Upgrade to continue.`
      : `You've used ${current.toLocaleString()} of ${limit.toLocaleString()} monthly screenings.`,
    time: "Just now",
    read: false,
    createdAt: new Date(),
  };
}

// ── Milestone: every 100 CVs screened ───────────────────────────────────────
export function milestonNotif(count: number): AppNotification {
  return {
    id: `milestone-${count}`,
    type: "success",
    title: `🎉 ${count} CVs screened!`,
    message: `Your team has now screened ${count.toLocaleString()} CVs with SahiScreen. Keep it up!`,
    time: "Just now",
    read: false,
    createdAt: new Date(),
  };
}

// ── Relative time label ──────────────────────────────────────────────────────
export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

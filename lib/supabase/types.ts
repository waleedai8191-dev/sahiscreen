export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_id: string;
  companies?: {
    id: string;
    name: string;
  };
} | null;

export interface SubscriptionStatus {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  cv_limit: number;
  cvs_used_this_month: number;

  // Extended fields
  plan_tier: string;
  payment_status: string;
  cv_limit_monthly: number;
  cv_count_current: number;
  job_limit: number;
  trial_end: string | null;
  current_period_end: string | null;
}

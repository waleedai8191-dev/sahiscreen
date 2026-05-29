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

export type SubscriptionStatus = {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  cv_limit: number;
  cvs_used_this_month: number;
} | null;

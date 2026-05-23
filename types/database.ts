export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";
export type UserRole = "admin" | "hr" | "viewer";
export type SubStatus = "trial" | "active" | "paused" | "cancelled" | "expired";
export type PlanTier = "essential" | "premium";
export type JobStatus = "active" | "paused" | "closed" | "archived";
export type CVStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed";
export type HRDecision = "accepted" | "rejected" | "pending";
export type Recommendation = "shortlist" | "consider" | "reject";
export type AIModel = "gemini" | "claude";

export interface Company {
  id: string;
  name: string;
  size: CompanySize;
  industry?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  designation?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_tier: PlanTier;
  status: SubStatus;
  trial_start: string;
  trial_end: string;
  current_period_start?: string;
  current_period_end?: string;
  cv_count_current: number;
  cv_limit_monthly: number;
  payfast_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  created_by?: string;
  title: string;
  department?: string;
  location?: string;
  job_type?: string;
  description: string;
  requirements?: string;
  status: JobStatus;
  cv_count: number;
  screened_count: number;
  created_at: string;
  updated_at: string;
}

export interface CVUpload {
  id: string;
  company_id: string;
  job_id: string;
  uploaded_by?: string;
  original_filename: string;
  file_path: string;
  file_size_kb?: number;
  file_type: "pdf" | "docx";
  parsed_text?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  extraction_status: CVStatus;
  screening_status: CVStatus;
  created_at: string;
  updated_at: string;
}

export interface ScreeningResult {
  id: string;
  company_id: string;
  job_id: string;
  cv_id: string;
  overall_score: number;
  relevance_score: number;
  achievement_score: number;
  red_flag_score: number;
  context_score: number;
  communication_score: number;
  recommendation: Recommendation;
  justification: string;
  red_flags: string[];
  strengths: string[];
  model_used: AIModel;
  hr_decision: HRDecision;
  hr_notes?: string;
  decided_by?: string;
  decided_at?: string;
  rank_position?: number;
  created_at: string;
  updated_at: string;
}

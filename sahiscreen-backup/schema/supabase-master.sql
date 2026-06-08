[
  {
    "table_name": "audit_log",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "audit_log",
    "column_name": "admin_email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "audit_log",
    "column_name": "action",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "audit_log",
    "column_name": "target_company_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "audit_log",
    "column_name": "details",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "audit_log",
    "column_name": "performed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "billing_history",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "billing_history",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "billing_history",
    "column_name": "amount",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "billing_history",
    "column_name": "plan_tier",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "billing_history",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'paid'::text"
  },
  {
    "table_name": "billing_history",
    "column_name": "payfast_payment_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "billing_history",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "blind_screenings",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'Untitled Screening'::text"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "blind_screenings",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'active'::text"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "cv_count",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "blind_screenings",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "blind_screenings",
    "column_name": "job_requirements",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "companies",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "size",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "industry",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "website",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "logo_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "companies",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "companies",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "job_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "uploaded_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "original_filename",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "file_path",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "file_size_kb",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "file_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "parsed_text",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "candidate_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "candidate_email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "candidate_phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "extraction_status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "screening_status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "cv_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "cv_uploads",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'new'::text"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "source",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'manual'::text"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "screening_mode",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'job_based'::text"
  },
  {
    "table_name": "cv_uploads",
    "column_name": "blind_screening_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "jobs",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "department",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "location",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "job_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "requirements",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'active'::text"
  },
  {
    "table_name": "jobs",
    "column_name": "cv_count",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "jobs",
    "column_name": "screened_count",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "jobs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "jobs",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "jobs",
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "employment_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'full-time'::text"
  },
  {
    "table_name": "jobs",
    "column_name": "experience_level",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'mid'::text"
  },
  {
    "table_name": "jobs",
    "column_name": "skills",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "candidate_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  },
  {
    "table_name": "jobs",
    "column_name": "salary_min",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "salary_max",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "jobs",
    "column_name": "salary_currency",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'PKR'::text"
  },
  {
    "table_name": "jobs",
    "column_name": "responsibilities",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "id",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "message",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications",
    "column_name": "read",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "notifications",
    "column_name": "deleted",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "notifications",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "notifications_log",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "notifications_log",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications_log",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications_log",
    "column_name": "email_to",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications_log",
    "column_name": "template_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "notifications_log",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'sent'::text"
  },
  {
    "table_name": "notifications_log",
    "column_name": "resend_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "notifications_log",
    "column_name": "sent_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "payments",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "subscription_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "payfast_reference",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "amount_pkr",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "payment_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "plan_tier",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "billing_period_start",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "billing_period_end",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "raw_webhook",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "screening_results",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "screening_results",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "job_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "cv_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "overall_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "relevance_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "achievement_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "red_flag_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "context_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "communication_score",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "recommendation",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "justification",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "red_flags",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "strengths",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "model_used",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "hr_decision",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "hr_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "decided_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "decided_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "rank_position",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "screening_results",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "screening_results",
    "column_name": "candidate_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "summary",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "score",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text"
  },
  {
    "table_name": "screening_results",
    "column_name": "screened_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "screening_results",
    "column_name": "interview_questions",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'[]'::jsonb"
  },
  {
    "table_name": "subscriptions",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "subscriptions",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "plan_tier",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'essential'::text"
  },
  {
    "table_name": "subscriptions",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'trial'::text"
  },
  {
    "table_name": "subscriptions",
    "column_name": "trial_start",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "subscriptions",
    "column_name": "trial_end",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "(now() + '14 days'::interval)"
  },
  {
    "table_name": "subscriptions",
    "column_name": "current_period_start",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "current_period_end",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "cv_count_current",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_name": "subscriptions",
    "column_name": "cv_limit_monthly",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "50"
  },
  {
    "table_name": "subscriptions",
    "column_name": "payfast_token",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "payfast_subscription_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "cancelled_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "subscriptions",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "subscriptions",
    "column_name": "job_limit",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "1"
  },
  {
    "table_name": "subscriptions",
    "column_name": "payment_status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'unpaid'::text"
  },
  {
    "table_name": "subscriptions",
    "column_name": "plan_selected_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "subscriptions",
    "column_name": "payfast_payment_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "company_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "full_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "designation",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'hr'::text"
  },
  {
    "table_name": "users",
    "column_name": "avatar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]




-- ═══════════════════════════════════════════════════════════
-- SAHISCREEN — REAL SCHEMA BACKUP (exported June 2026)
-- Tables: 12 | Source: Supabase SQL export
-- ═══════════════════════════════════════════════════════════

-- EXTENSIONS REQUIRED
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── companies ────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  size        TEXT,
  industry    TEXT,
  website     TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── users ────────────────────────────────────────────────
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  full_name    TEXT,
  email        TEXT NOT NULL,
  designation  TEXT,
  role         TEXT DEFAULT 'hr',
  avatar_url   TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── subscriptions ─────────────────────────────────────────
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_tier               TEXT DEFAULT 'essential',
  status                  TEXT DEFAULT 'trial',
  trial_start             TIMESTAMPTZ DEFAULT now(),
  trial_end               TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cv_count_current        INT DEFAULT 0,
  cv_limit_monthly        INT DEFAULT 50,  -- NOTE: sync with plans.ts
  job_limit               INT DEFAULT 1,
  payment_status          TEXT DEFAULT 'unpaid',
  plan_selected_at        TIMESTAMPTZ,
  payfast_token           TEXT,
  payfast_subscription_id TEXT,
  payfast_payment_id      TEXT,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ── payments ──────────────────────────────────────────────
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id       UUID REFERENCES subscriptions(id),
  payfast_reference     TEXT,
  amount_pkr            NUMERIC NOT NULL,
  status                TEXT,
  payment_date          TIMESTAMPTZ,
  plan_tier             TEXT,
  billing_period_start  TIMESTAMPTZ,
  billing_period_end    TIMESTAMPTZ,
  raw_webhook           JSONB,  -- full PayFast webhook payload
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── billing_history ───────────────────────────────────────
CREATE TABLE billing_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount              INT NOT NULL,
  plan_tier           TEXT NOT NULL,
  status              TEXT DEFAULT 'paid',
  payfast_payment_id  TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ── jobs ──────────────────────────────────────────────────
CREATE TABLE jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES users(id),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  department       TEXT,
  location         TEXT,
  job_type         TEXT,
  employment_type  TEXT DEFAULT 'full-time',
  experience_level TEXT DEFAULT 'mid',
  description      TEXT NOT NULL,
  requirements     TEXT,
  responsibilities TEXT,
  skills           TEXT[],
  salary_min       INT,
  salary_max       INT,
  salary_currency  TEXT DEFAULT 'PKR',
  status           TEXT DEFAULT 'active',
  cv_count         INT DEFAULT 0,
  screened_count   INT DEFAULT 0,
  candidate_count  INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── blind_screenings ──────────────────────────────────────
CREATE TABLE blind_screenings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES users(id),
  name             TEXT NOT NULL DEFAULT 'Untitled Screening',
  description      TEXT,
  job_requirements TEXT,
  status           TEXT DEFAULT 'active',
  cv_count         INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── cv_uploads ────────────────────────────────────────────
CREATE TABLE cv_uploads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,
  blind_screening_id  UUID REFERENCES blind_screenings(id) ON DELETE SET NULL,
  uploaded_by         UUID REFERENCES users(id),
  original_filename   TEXT NOT NULL,
  file_path           TEXT NOT NULL,
  cv_url              TEXT,
  file_size_kb        INT,
  file_type           TEXT,
  parsed_text         TEXT,  -- WARNING: can be large
  candidate_name      TEXT,
  candidate_email     TEXT,
  candidate_phone     TEXT,
  source              TEXT NOT NULL DEFAULT 'manual',  -- manual | apply_link
  status              TEXT NOT NULL DEFAULT 'new',
  screening_status    TEXT DEFAULT 'pending',
  extraction_status   TEXT DEFAULT 'pending',
  screening_mode      TEXT DEFAULT 'job_based',  -- job_based | blind
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── screening_results ─────────────────────────────────────
CREATE TABLE screening_results (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id               UUID REFERENCES jobs(id),
  cv_id                UUID NOT NULL REFERENCES cv_uploads(id) ON DELETE CASCADE,
  candidate_id         UUID,  -- legacy alias for cv_id
  overall_score        NUMERIC,
  score                INT,   -- NOTE: consolidate with overall_score
  relevance_score      NUMERIC,
  achievement_score    NUMERIC,
  red_flag_score       NUMERIC,
  context_score        NUMERIC,
  communication_score  NUMERIC,
  recommendation       TEXT,  -- Shortlist | Consider | Reject
  justification        TEXT,
  summary              TEXT,
  red_flags            TEXT[],
  strengths            TEXT[],
  interview_questions  JSONB DEFAULT '[]',
  model_used           TEXT,
  hr_decision          TEXT,
  hr_notes             TEXT,
  decided_by           UUID REFERENCES users(id),
  decided_at           TIMESTAMPTZ,
  rank_position        INT,
  status               TEXT DEFAULT 'pending',
  screened_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ── notifications ─────────────────────────────────────────
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT false,
  deleted     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── notifications_log ─────────────────────────────────────
CREATE TABLE notifications_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID REFERENCES companies(id),
  user_id        UUID REFERENCES auth.users(id),
  email_to       TEXT NOT NULL,
  template_name  TEXT NOT NULL,
  resend_id      TEXT,
  status         TEXT DEFAULT 'sent',
  sent_at        TIMESTAMPTZ DEFAULT now()
);

-- ── audit_log ─────────────────────────────────────────────
CREATE TABLE audit_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email       TEXT NOT NULL,
  action            TEXT NOT NULL,
  target_company_id UUID REFERENCES companies(id),
  details           JSONB,
  performed_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX idx_cv_uploads_company    ON cv_uploads(company_id, created_at DESC);
CREATE INDEX idx_cv_uploads_job        ON cv_uploads(job_id);
CREATE INDEX idx_screening_company     ON screening_results(company_id, created_at DESC);
CREATE INDEX idx_screening_cv          ON screening_results(cv_id);
CREATE INDEX idx_jobs_company          ON jobs(company_id, status);
CREATE INDEX idx_jobs_slug             ON jobs(slug);
CREATE INDEX idx_notifications_company ON notifications(company_id, deleted, created_at DESC);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_payments_company      ON payments(company_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: keep jobs.candidate_count in sync
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_job_cv_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE jobs
  SET candidate_count = (
    SELECT COUNT(*) FROM cv_uploads WHERE job_id = NEW.job_id
  ),
  cv_count = (
    SELECT COUNT(*) FROM cv_uploads WHERE job_id = NEW.job_id
  )
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_job_cv_count
AFTER INSERT OR DELETE ON cv_uploads
FOR EACH ROW EXECUTE FUNCTION sync_job_cv_count();
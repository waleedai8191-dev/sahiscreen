-- ============================================================
-- CLEAN PUBLIC SCHEMA DUMP
-- Only your business tables, functions, triggers, RLS policies
-- Safe to run on any fresh Supabase project
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================
-- FUNCTIONS
-- ============================================================

--
-- Name: expire_trials(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.expire_trials() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE subscriptions
  SET 
    status   = 'expired',
    plan_tier = 'expired'
  WHERE 
    plan_tier = 'trial'
    AND trial_end < NOW()
    AND status != 'expired';
END;
$$;

--
-- Name: get_my_company_id(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.get_my_company_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT company_id 
  FROM public.users 
  WHERE id = auth.uid();
$$;

--
-- Name: get_my_role(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select role from public.users
  where id = auth.uid()
$$;

--
-- Name: handle_new_auth_user(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_company_id uuid;
  v_company_name text;
  v_full_name text;
begin
  v_full_name    := coalesce(new.raw_user_meta_data->>'full_name', 
                             new.raw_user_meta_data->>'name', 
                             'Unknown');
  v_company_name := coalesce(new.raw_user_meta_data->>'company_name', 
                             'My Company');

  if exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  insert into public.companies (name)
  values (v_company_name)
  returning id into v_company_id;

  insert into public.users (id, company_id, full_name, email, role)
  values (new.id, v_company_id, v_full_name, new.email, 'admin');

  insert into public.subscriptions (
    company_id,
    plan_tier,
    status,
    trial_start,
    trial_end,
    cv_count_current,
    cv_limit_monthly
  ) values (
    v_company_id,
    'essential',
    'trial',
    now(),
    now() + interval '14 days',
    0,
    50
  );

  return new;
exception
  when others then
    raise warning 'handle_new_auth_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'admin',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

--
-- Name: increment_cv_count(uuid, integer); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.increment_cv_count(p_company_id uuid, p_count integer DEFAULT 1) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE subscriptions
  SET 
    cv_count_current = cv_count_current + p_count,
    updated_at = NOW()
  WHERE company_id = p_company_id;
END;
$$;

--
-- Name: reset_monthly_cv_counts(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.reset_monthly_cv_counts() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE subscriptions
  SET
    cv_count_current = 0,
    updated_at = NOW()
  WHERE status = 'active';

  RAISE LOG 'Monthly CV counts reset at %', NOW();
END;
$$;

--
-- Name: set_trial_dates(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.set_trial_dates() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.plan_tier = 'trial' THEN
    IF NEW.trial_start IS NULL THEN
      NEW.trial_start := NOW();
    END IF;
    IF NEW.trial_end IS NULL THEN
      NEW.trial_end := NEW.trial_start + INTERVAL '15 days';
    END IF;
    NEW.cv_limit_monthly := 30;
    NEW.job_limit        := 1;
  END IF;

  IF NEW.plan_tier = 'essential' THEN
    NEW.cv_limit_monthly := 1000;
    NEW.job_limit        := 20;
  END IF;

  IF NEW.plan_tier = 'premium' THEN
    NEW.cv_limit_monthly := 2000;
    NEW.job_limit        := 35;
  END IF;

  RETURN NEW;
END;
$$;

--
-- Name: update_job_cv_counts(); Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.update_job_cv_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs 
    SET candidate_count = candidate_count + 1
    WHERE id = NEW.job_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs 
    SET candidate_count = candidate_count - 1
    WHERE id = OLD.job_id;
  END IF;

  RETURN NULL;
END;
$$;

-- ============================================================
-- TABLES
-- ============================================================

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: companies
--

CREATE TABLE public.companies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    size text,
    industry text,
    website text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT companies_size_check CHECK ((size = ANY (ARRAY['1-10'::text, '11-50'::text, '51-200'::text, '201-500'::text, '500+'::text])))
);

--
-- Name: users
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    company_id uuid,
    full_name text,
    email text NOT NULL,
    designation text,
    role text DEFAULT 'hr'::text,
    avatar_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'hr'::text, 'viewer'::text, 'superadmin'::text])))
);

--
-- Name: subscriptions
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    plan_tier text DEFAULT 'essential'::text,
    status text DEFAULT 'trial'::text,
    trial_start timestamp with time zone DEFAULT now(),
    trial_end timestamp with time zone DEFAULT (now() + '14 days'::interval),
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cv_count_current integer DEFAULT 0,
    cv_limit_monthly integer DEFAULT 50,
    payfast_token text,
    payfast_subscription_id text,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    job_limit integer DEFAULT 1,
    payment_status text DEFAULT 'unpaid'::text,
    plan_selected_at timestamp with time zone,
    payfast_payment_id text,
    CONSTRAINT subscriptions_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'failed'::text]))),
    CONSTRAINT subscriptions_plan_tier_check CHECK ((plan_tier = ANY (ARRAY['free'::text, 'essential'::text, 'premium'::text]))),
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['pending_payment'::text, 'trial'::text, 'active'::text, 'paused'::text, 'cancelled'::text, 'expired'::text])))
);

--
-- Name: jobs
--

CREATE TABLE public.jobs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    created_by uuid,
    title text NOT NULL,
    department text,
    location text,
    job_type text,
    description text NOT NULL,
    requirements text,
    status text DEFAULT 'active'::text,
    cv_count integer DEFAULT 0,
    screened_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    slug text NOT NULL,
    employment_type text DEFAULT 'full-time'::text,
    experience_level text DEFAULT 'mid'::text,
    skills text[],
    candidate_count integer DEFAULT 0 NOT NULL,
    salary_min integer,
    salary_max integer,
    salary_currency text DEFAULT 'PKR'::text,
    responsibilities text,
    CONSTRAINT jobs_job_type_check CHECK ((job_type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'internship'::text]))),
    CONSTRAINT jobs_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text, 'paused'::text, 'closed'::text, 'archived'::text])))
);

--
-- Name: blind_screenings
--

CREATE TABLE public.blind_screenings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text DEFAULT 'Untitled Screening'::text NOT NULL,
    description text,
    status text DEFAULT 'active'::text,
    cv_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    job_requirements text,
    CONSTRAINT blind_screenings_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);

--
-- Name: cv_uploads
--

CREATE TABLE public.cv_uploads (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    job_id uuid,
    uploaded_by uuid,
    original_filename text NOT NULL,
    file_path text NOT NULL,
    file_size_kb integer,
    file_type text,
    parsed_text text,
    candidate_name text,
    candidate_email text,
    candidate_phone text,
    extraction_status text DEFAULT 'pending'::text,
    screening_status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cv_url text,
    status text DEFAULT 'new'::text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    screening_mode text DEFAULT 'job_based'::text,
    blind_screening_id uuid,
    CONSTRAINT cv_uploads_extraction_status_check CHECK ((extraction_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT cv_uploads_file_type_check CHECK ((file_type = ANY (ARRAY['pdf'::text, 'docx'::text]))),
    CONSTRAINT cv_uploads_screening_mode_check CHECK ((screening_mode = ANY (ARRAY['job_based'::text, 'blind'::text]))),
    CONSTRAINT cv_uploads_screening_status_check CHECK ((screening_status = ANY (ARRAY['pending'::text, 'queued'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT cv_uploads_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'apply_link'::text]))),
    CONSTRAINT cv_uploads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'screening'::text, 'shortlisted'::text, 'rejected'::text, 'hired'::text])))
);

--
-- Name: screening_results
--

CREATE TABLE public.screening_results (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    job_id uuid,
    cv_id uuid NOT NULL,
    overall_score numeric(5,2),
    relevance_score numeric(5,2),
    achievement_score numeric(5,2),
    red_flag_score numeric(5,2),
    context_score numeric(5,2),
    communication_score numeric(5,2),
    recommendation text,
    justification text,
    red_flags text[],
    strengths text[],
    model_used text,
    hr_decision text,
    hr_notes text,
    decided_by uuid,
    decided_at timestamp with time zone,
    rank_position integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    candidate_id uuid,
    summary text,
    score integer,
    status text DEFAULT 'pending'::text,
    screened_at timestamp with time zone,
    interview_questions jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT screening_results_achievement_score_check CHECK (((achievement_score >= (0)::numeric) AND (achievement_score <= (100)::numeric))),
    CONSTRAINT screening_results_communication_score_check CHECK (((communication_score >= (0)::numeric) AND (communication_score <= (100)::numeric))),
    CONSTRAINT screening_results_context_score_check CHECK (((context_score >= (0)::numeric) AND (context_score <= (100)::numeric))),
    CONSTRAINT screening_results_hr_decision_check CHECK ((hr_decision = ANY (ARRAY['accepted'::text, 'rejected'::text, 'pending'::text]))),
    CONSTRAINT screening_results_model_used_check CHECK ((model_used = ANY (ARRAY['gemini'::text, 'claude'::text, 'gemini-pro'::text, 'claude-sonnet-4-5'::text, 'claude-haiku-4-5'::text]))),
    CONSTRAINT screening_results_overall_score_check CHECK (((overall_score >= (0)::numeric) AND (overall_score <= (100)::numeric))),
    CONSTRAINT screening_results_recommendation_check CHECK ((recommendation = ANY (ARRAY['shortlist'::text, 'consider'::text, 'reject'::text]))),
    CONSTRAINT screening_results_red_flag_score_check CHECK (((red_flag_score >= (0)::numeric) AND (red_flag_score <= (100)::numeric))),
    CONSTRAINT screening_results_relevance_score_check CHECK (((relevance_score >= (0)::numeric) AND (relevance_score <= (100)::numeric)))
);

--
-- Name: payments
--

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    subscription_id uuid,
    payfast_reference text,
    amount_pkr numeric(10,2) NOT NULL,
    status text,
    payment_date timestamp with time zone,
    plan_tier text,
    billing_period_start timestamp with time zone,
    billing_period_end timestamp with time zone,
    raw_webhook jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);

--
-- Name: billing_history
--

CREATE TABLE public.billing_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    amount integer NOT NULL,
    plan_tier text NOT NULL,
    status text DEFAULT 'paid'::text,
    payfast_payment_id text,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: notifications
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    company_id uuid,
    user_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

--
-- Name: notifications_log
--

CREATE TABLE public.notifications_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    company_id uuid,
    user_id uuid,
    email_to text NOT NULL,
    template_name text NOT NULL,
    status text DEFAULT 'sent'::text,
    resend_id text,
    sent_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text, 'bounced'::text])))
);

--
-- Name: audit_log
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    admin_email text NOT NULL,
    action text NOT NULL,
    target_company_id uuid,
    details jsonb,
    performed_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_slug_unique UNIQUE (slug);

ALTER TABLE ONLY public.blind_screenings
    ADD CONSTRAINT blind_screenings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cv_uploads
    ADD CONSTRAINT cv_uploads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_candidate_id_unique UNIQUE (candidate_id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications_log
    ADD CONSTRAINT notifications_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_cv_uploads_company ON public.cv_uploads USING btree (company_id);
CREATE INDEX idx_cv_uploads_company_id ON public.cv_uploads USING btree (company_id);
CREATE INDEX idx_cv_uploads_job ON public.cv_uploads USING btree (job_id);
CREATE INDEX idx_cv_uploads_job_id ON public.cv_uploads USING btree (job_id);
CREATE INDEX idx_cv_uploads_screening_status ON public.cv_uploads USING btree (screening_status);
CREATE INDEX idx_jobs_company ON public.jobs USING btree (company_id);
CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id);
CREATE INDEX idx_jobs_slug ON public.jobs USING btree (slug);
CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);
CREATE INDEX idx_payments_company ON public.payments USING btree (company_id);
CREATE INDEX idx_screening_candidate_id ON public.screening_results USING btree (candidate_id);
CREATE INDEX idx_screening_company ON public.screening_results USING btree (company_id);
CREATE INDEX idx_screening_job ON public.screening_results USING btree (job_id);
CREATE INDEX idx_screening_job_id ON public.screening_results USING btree (job_id);
CREATE INDEX idx_screening_score ON public.screening_results USING btree (overall_score DESC);
CREATE INDEX idx_subscriptions_company ON public.subscriptions USING btree (company_id);
CREATE INDEX idx_users_company ON public.users USING btree (company_id);
CREATE INDEX notifications_company_id_deleted_created_at_idx ON public.notifications USING btree (company_id, deleted, created_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Signup bridge: connects Supabase auth to your users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER auto_set_trial_dates
    BEFORE INSERT ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_trial_dates();

CREATE TRIGGER on_companies_updated
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cv_uploads_updated
    BEFORE UPDATE ON public.cv_uploads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_jobs_updated
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_screening_updated
    BEFORE UPDATE ON public.screening_results
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_subscriptions_updated
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_users_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_job_cv_counts
    AFTER INSERT OR DELETE OR UPDATE ON public.cv_uploads
    FOR EACH ROW EXECUTE FUNCTION public.update_job_cv_counts();

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.blind_screenings
    ADD CONSTRAINT blind_screenings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.blind_screenings
    ADD CONSTRAINT blind_screenings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.cv_uploads
    ADD CONSTRAINT cv_uploads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cv_uploads
    ADD CONSTRAINT cv_uploads_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cv_uploads
    ADD CONSTRAINT cv_uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.cv_uploads
    ADD CONSTRAINT cv_uploads_blind_screening_id_fkey FOREIGN KEY (blind_screening_id) REFERENCES public.blind_screenings(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cv_uploads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.cv_uploads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.screening_results
    ADD CONSTRAINT screening_results_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications_log
    ADD CONSTRAINT notifications_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications_log
    ADD CONSTRAINT notifications_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_target_company_id_fkey FOREIGN KEY (target_company_id) REFERENCES public.companies(id);

-- ============================================================
-- ROW LEVEL SECURITY - ENABLE
-- ============================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blind_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- companies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING ((id = public.get_my_company_id()));

CREATE POLICY "Admins can update their company" ON public.companies
    FOR UPDATE USING (((id = public.get_my_company_id()) AND (public.get_my_role() = 'admin'::text)));

CREATE POLICY "Service role can insert companies" ON public.companies
    FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY companies_isolation ON public.companies
    USING ((id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- users
CREATE POLICY "Users can read own row" ON public.users
    FOR SELECT USING ((auth.uid() = id));

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING ((id = auth.uid()));

CREATE POLICY "Users can view teammates" ON public.users
    FOR SELECT USING (((company_id IS NOT NULL) AND (company_id = public.get_my_company_id())));

CREATE POLICY "Admins can manage team members" ON public.users
    USING (((company_id = public.get_my_company_id()) AND (public.get_my_role() = 'admin'::text)));

CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY users_select_own ON public.users
    FOR SELECT USING ((auth.uid() = id));

CREATE POLICY users_update_own ON public.users
    FOR UPDATE USING ((auth.uid() = id));

-- subscriptions
CREATE POLICY "Company can view own subscription" ON public.subscriptions
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
    USING ((auth.role() = 'service_role'::text));

CREATE POLICY subscriptions_company_isolation ON public.subscriptions
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- jobs
CREATE POLICY "Company can view own jobs" ON public.jobs
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY "HR and admin can create jobs" ON public.jobs
    FOR INSERT WITH CHECK (((company_id = public.get_my_company_id()) AND (public.get_my_role() = ANY (ARRAY['admin'::text, 'hr'::text]))));

CREATE POLICY "HR and admin can update jobs" ON public.jobs
    FOR UPDATE USING (((company_id = public.get_my_company_id()) AND (public.get_my_role() = ANY (ARRAY['admin'::text, 'hr'::text]))));

CREATE POLICY jobs_company_isolation ON public.jobs
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- blind_screenings
CREATE POLICY "Company members can manage blind screenings" ON public.blind_screenings
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- cv_uploads
CREATE POLICY "Company can view own CVs" ON public.cv_uploads
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY "HR and admin can upload CVs" ON public.cv_uploads
    FOR INSERT WITH CHECK (((company_id = public.get_my_company_id()) AND (public.get_my_role() = ANY (ARRAY['admin'::text, 'hr'::text]))));

CREATE POLICY "Service role can update CVs" ON public.cv_uploads
    FOR UPDATE USING ((auth.role() = 'service_role'::text));

CREATE POLICY cv_uploads_company_isolation ON public.cv_uploads
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- screening_results
CREATE POLICY "Company can view own results" ON public.screening_results
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY "HR and admin can update decisions" ON public.screening_results
    FOR UPDATE USING (((company_id = public.get_my_company_id()) AND (public.get_my_role() = ANY (ARRAY['admin'::text, 'hr'::text]))));

CREATE POLICY "Service role manages screening" ON public.screening_results
    USING ((auth.role() = 'service_role'::text));

CREATE POLICY screening_results_company_isolation ON public.screening_results
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- payments
CREATE POLICY "Company can view own payments" ON public.payments
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY "Service role manages payments" ON public.payments
    USING ((auth.role() = 'service_role'::text));

CREATE POLICY payments_company_isolation ON public.payments
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- billing_history
CREATE POLICY "Company members can view billing history" ON public.billing_history
    FOR SELECT USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING ((auth.uid() = user_id));

-- notifications_log
CREATE POLICY "Company can view own notifications" ON public.notifications_log
    FOR SELECT USING ((company_id = public.get_my_company_id()));

CREATE POLICY notifications_log_company_isolation ON public.notifications_log
    USING ((company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- audit_log
CREATE POLICY "Only service role can access audit log" ON public.audit_log
    USING ((auth.role() = 'service_role'::text));

CREATE POLICY audit_log_company_isolation ON public.audit_log
    USING ((target_company_id = ( SELECT users.company_id FROM public.users WHERE (users.id = auth.uid()))));

-- ============================================================
-- STORAGE POLICIES (your CV bucket rules — keep these)
-- ============================================================

CREATE POLICY "Allow authenticated CV deletes" ON storage.objects
    FOR DELETE TO authenticated USING ((bucket_id = 'cvs'::text));

CREATE POLICY "Allow authenticated CV uploads" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'cvs'::text));

CREATE POLICY "Allow public CV reads" ON storage.objects
    FOR SELECT USING ((bucket_id = 'cvs'::text));

CREATE POLICY "Allow public CV uploads" ON storage.objects
    FOR INSERT WITH CHECK ((bucket_id = 'cvs'::text));

CREATE POLICY "Company can read own CVs" ON storage.objects
    FOR SELECT USING (((bucket_id = 'cv-files'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY "Company can upload CVs" ON storage.objects
    FOR INSERT WITH CHECK (((bucket_id = 'cv-files'::text) AND (auth.role() = 'authenticated'::text)));

CREATE POLICY "Service role full storage access" ON storage.objects
    USING ((auth.role() = 'service_role'::text));

-- ============================================================
-- GRANTS (only public schema tables)
-- ============================================================

GRANT ALL ON TABLE public.audit_log TO anon;
GRANT ALL ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;

GRANT ALL ON TABLE public.billing_history TO anon;
GRANT ALL ON TABLE public.billing_history TO authenticated;
GRANT ALL ON TABLE public.billing_history TO service_role;

GRANT ALL ON TABLE public.blind_screenings TO anon;
GRANT ALL ON TABLE public.blind_screenings TO authenticated;
GRANT ALL ON TABLE public.blind_screenings TO service_role;

GRANT ALL ON TABLE public.companies TO anon;
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;

GRANT ALL ON TABLE public.cv_uploads TO anon;
GRANT ALL ON TABLE public.cv_uploads TO authenticated;
GRANT ALL ON TABLE public.cv_uploads TO service_role;

GRANT ALL ON TABLE public.jobs TO anon;
GRANT ALL ON TABLE public.jobs TO authenticated;
GRANT ALL ON TABLE public.jobs TO service_role;

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

GRANT ALL ON TABLE public.notifications_log TO anon;
GRANT ALL ON TABLE public.notifications_log TO authenticated;
GRANT ALL ON TABLE public.notifications_log TO service_role;

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;

GRANT ALL ON TABLE public.screening_results TO anon;
GRANT ALL ON TABLE public.screening_results TO authenticated;
GRANT ALL ON TABLE public.screening_results TO service_role;

GRANT ALL ON TABLE public.subscriptions TO anon;
GRANT ALL ON TABLE public.subscriptions TO authenticated;
GRANT ALL ON TABLE public.subscriptions TO service_role;

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

GRANT ALL ON FUNCTION public.expire_trials() TO anon;
GRANT ALL ON FUNCTION public.expire_trials() TO authenticated;
GRANT ALL ON FUNCTION public.expire_trials() TO service_role;

GRANT ALL ON FUNCTION public.get_my_company_id() TO anon;
GRANT ALL ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_company_id() TO service_role;

GRANT ALL ON FUNCTION public.get_my_role() TO anon;
GRANT ALL ON FUNCTION public.get_my_role() TO authenticated;
GRANT ALL ON FUNCTION public.get_my_role() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_auth_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_auth_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_auth_user() TO service_role;

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

GRANT ALL ON FUNCTION public.handle_updated_at() TO anon;
GRANT ALL ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.handle_updated_at() TO service_role;

GRANT ALL ON FUNCTION public.increment_cv_count(uuid, integer) TO anon;
GRANT ALL ON FUNCTION public.increment_cv_count(uuid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_cv_count(uuid, integer) TO service_role;

GRANT ALL ON FUNCTION public.reset_monthly_cv_counts() TO anon;
GRANT ALL ON FUNCTION public.reset_monthly_cv_counts() TO authenticated;
GRANT ALL ON FUNCTION public.reset_monthly_cv_counts() TO service_role;

GRANT ALL ON FUNCTION public.set_trial_dates() TO anon;
GRANT ALL ON FUNCTION public.set_trial_dates() TO authenticated;
GRANT ALL ON FUNCTION public.set_trial_dates() TO service_role;

GRANT ALL ON FUNCTION public.update_job_cv_counts() TO anon;
GRANT ALL ON FUNCTION public.update_job_cv_counts() TO authenticated;
GRANT ALL ON FUNCTION public.update_job_cv_counts() TO service_role;

-- ============================================================
-- END OF FILE
-- ============================================================
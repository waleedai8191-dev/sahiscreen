"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ChevronDown,
  Sparkles,
  Building2,
  Users,
  Target,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobForm {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  description: string;
  requirements: string;
  responsibilities: string;
  skills: string[];
  status: "active" | "draft";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info", icon: Briefcase },
  { id: 2, label: "Job Details", icon: FileText },
  { id: 3, label: "Requirements", icon: Target },
  { id: 4, label: "Review", icon: CheckCircle2 },
];

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "HR & People",
  "Operations",
  "Product",
  "Design",
  "Legal",
  "Customer Support",
  "Supply Chain",
  "Procurement",
  "Admin",
  "Other",
];

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Remote",
  "On-site",
  "Hybrid",
];

const EMP_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const EXP_LEVELS = [
  { value: "entry", label: "Entry Level (0–2 yrs)" },
  { value: "mid", label: "Mid Level (2–5 yrs)" },
  { value: "senior", label: "Senior Level (5–8 yrs)" },
  { value: "lead", label: "Lead / Manager (8+ yrs)" },
  { value: "director", label: "Director / VP" },
];

const SUGGESTED_SKILLS: Record<string, string[]> = {
  Engineering: [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "SQL",
    "AWS",
    "Docker",
  ],
  Marketing: [
    "SEO",
    "Google Ads",
    "Meta Ads",
    "Content Writing",
    "Analytics",
    "Canva",
  ],
  Finance: ["Excel", "SAP", "QuickBooks", "Financial Modeling", "ACCA", "CFA"],
  Sales: ["CRM", "Negotiation", "Lead Generation", "B2B Sales", "Salesforce"],
  "HR & People": [
    "Recruitment",
    "HRIS",
    "Payroll",
    "Labor Law",
    "Performance Management",
  ],
  Design: ["Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX"],
  Operations: [
    "Supply Chain",
    "ERP",
    "Logistics",
    "Process Improvement",
    "Six Sigma",
  ],
};

const INITIAL_FORM: JobForm = {
  title: "",
  department: "",
  location: "",
  employment_type: "full_time",
  experience_level: "mid",
  salary_min: "",
  salary_max: "",
  salary_currency: "PKR",
  description: "",
  requirements: "",
  responsibilities: "",
  skills: [],
  status: "active",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewJobPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JobForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>(
    {},
  );
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const skillRef = useRef<HTMLInputElement>(null);

  // ── Field helpers ──────────────────────────────────────────────────────────

  const set = (field: keyof JobForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));

  const suggestedSkills = SUGGESTED_SKILLS[form.department] ?? [];

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof JobForm, string>> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = "Job title is required";
      if (!form.department) e.department = "Department is required";
      if (!form.location) e.location = "Location is required";
    }
    if (s === 2) {
      if (!form.description.trim())
        e.description = "Job description is required (min 100 chars)";
      else if (form.description.trim().length < 100)
        e.description = "Description should be at least 100 characters";
    }
    if (s === 3) {
      if (!form.requirements.trim())
        e.requirements = "Requirements are required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validate(step)) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (status: "active" | "draft") => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          department: form.department,
          location: form.location,
          employment_type: form.employment_type,
          experience_level: form.experience_level,
          salary_min: form.salary_min ? parseInt(form.salary_min) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max) : null,
          salary_currency: form.salary_currency,
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          responsibilities: form.responsibilities.trim(),
          skills: form.skills,
          status,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create job");

      router.push(`/dashboard/jobs/${json.job.id}`);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create job",
      );
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }

        .new-job-page {
          min-height:100%; background:#f8fafc;
          padding:28px 32px 60px;
          font-family:'Plus Jakarta Sans',sans-serif;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .reveal { animation:fadeUp .38s cubic-bezier(.22,1,.36,1) both; }

        /* ── Back + title ── */
        .back-link {
          display:inline-flex; align-items:center; gap:7px;
          font-size:13px; font-weight:600; color:#64748b;
          text-decoration:none; margin-bottom:20px;
          transition:color .18s;
        }
        .back-link:hover { color:#7C3AED; }
        .page-title { font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-.4px; }
        .page-sub   { font-size:13px; color:#64748b; margin-top:3px; font-weight:500; margin-bottom:28px; }

        /* ── Stepper ── */
        .stepper {
          display:flex; align-items:center; gap:0;
          margin-bottom:32px; background:#fff;
          border:1px solid #e2e8f0; border-radius:14px; padding:6px;
        }
        .step-item {
          flex:1; display:flex; align-items:center; justify-content:center;
          gap:8px; padding:10px 8px; border-radius:10px;
          font-size:12px; font-weight:600; color:#94a3b8;
          transition:background .2s, color .2s; position:relative;
        }
        .step-item.done    { color:#22c55e; }
        .step-item.active  { background:rgba(124,58,237,.08); color:#7C3AED; }
        .step-num {
          width:22px; height:22px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; flex-shrink:0;
          background:#f1f5f9; color:#94a3b8;
        }
        .step-item.active .step-num  { background:#7C3AED; color:#fff; }
        .step-item.done   .step-num  { background:#22c55e; color:#fff; }
        .step-connector {
          width:1px; height:24px; background:#e2e8f0; flex-shrink:0;
        }
        @media (max-width:600px) {
          .step-label { display:none; }
          .step-item  { flex:0 0 44px; padding:10px 4px; }
        }

        /* ── Layout ── */
        .form-layout {
          display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start;
        }
        @media (max-width:900px) {
          .form-layout { grid-template-columns:1fr; }
          .sidebar-tips { order:99; }
        }

        /* ── Card ── */
        .form-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;
        }
        .card-head {
          padding:20px 24px 16px; border-bottom:1px solid #f1f5f9;
          display:flex; align-items:center; gap:12px;
        }
        .card-head-icon {
          width:38px; height:38px; border-radius:10px;
          background:rgba(124,58,237,.1);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .card-head-title { font-size:15px; font-weight:700; color:#0f172a; }
        .card-head-sub   { font-size:12px; color:#94a3b8; margin-top:2px; }
        .card-body { padding:24px; display:flex; flex-direction:column; gap:20px; }

        /* ── Form fields ── */
        .field { display:flex; flex-direction:column; gap:6px; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .field-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

        label {
          font-size:12px; font-weight:700; color:#374151;
          text-transform:uppercase; letter-spacing:.04em;
        }
        .required { color:#ef4444; margin-left:2px; }

        .inp, .sel, .textarea {
          width:100%; padding:10px 14px;
          border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:13px; font-family:'Plus Jakarta Sans',sans-serif;
          color:#0f172a; background:#fff; outline:none;
          transition:border-color .2s, box-shadow .2s;
        }
        .inp::placeholder, .textarea::placeholder { color:#94a3b8; }
        .inp:focus, .sel:focus, .textarea:focus {
          border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08);
        }
        .inp.error, .sel.error, .textarea.error { border-color:#ef4444; }
        .textarea { resize:vertical; min-height:130px; line-height:1.6; }

        .sel-wrap { position:relative; }
        .sel { appearance:none; padding-right:34px; cursor:pointer; }
        .sel-arrow {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          pointer-events:none; color:#94a3b8;
        }

        .field-error { font-size:11px; color:#ef4444; font-weight:500; display:flex; align-items:center; gap:4px; }
        .field-hint  { font-size:11px; color:#94a3b8; }
        .char-count  { font-size:11px; color:#94a3b8; text-align:right; }

        /* ── Salary row ── */
        .salary-prefix {
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          font-size:12px; font-weight:600; color:#64748b; pointer-events:none;
        }
        .inp.has-prefix { padding-left:42px; }

        /* ── Skills ── */
        .skills-box {
          border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 12px;
          display:flex; flex-wrap:wrap; gap:7px; min-height:48px;
          cursor:text; transition:border-color .2s, box-shadow .2s;
        }
        .skills-box:focus-within {
          border-color:#7C3AED; box-shadow:0 0 0 3px rgba(124,58,237,.08);
        }
        .skill-tag {
          display:inline-flex; align-items:center; gap:5px;
          background:rgba(124,58,237,.1); color:#7C3AED;
          font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px;
        }
        .skill-remove {
          background:none; border:none; cursor:pointer; padding:0;
          color:#a78bfa; display:flex; align-items:center;
          transition:color .15s;
        }
        .skill-remove:hover { color:#7C3AED; }
        .skill-inp {
          border:none; outline:none; font-size:13px;
          font-family:'Plus Jakarta Sans',sans-serif; color:#0f172a;
          background:transparent; min-width:80px; flex:1;
        }
        .skill-inp::placeholder { color:#94a3b8; }

        .suggested-skills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
        .sug-btn {
          padding:4px 10px; border-radius:20px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:11px; font-weight:600; color:#64748b;
          cursor:pointer; transition:all .15s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .sug-btn:hover { border-color:#7C3AED; color:#7C3AED; background:rgba(124,58,237,.05); }
        .sug-btn.added { border-color:#22c55e; color:#16a34a; background:rgba(34,197,94,.07); }

        /* ── Toggle chips (emp type, exp level) ── */
        .toggle-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .t-chip {
          padding:8px 14px; border-radius:9px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:12px; font-weight:600; color:#64748b;
          cursor:pointer; transition:all .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .t-chip:hover  { border-color:#c4b5fd; color:#7C3AED; }
        .t-chip.active { border-color:#7C3AED; background:rgba(124,58,237,.08); color:#7C3AED; }

        /* ── Status toggle ── */
        .status-toggle {
          display:grid; grid-template-columns:1fr 1fr; gap:10px;
        }
        .status-opt {
          padding:14px 16px; border-radius:12px; border:2px solid #e2e8f0;
          background:#fff; cursor:pointer; transition:all .18s; text-align:left;
        }
        .status-opt:hover { border-color:#c4b5fd; }
        .status-opt.active { border-color:#7C3AED; background:rgba(124,58,237,.05); }
        .status-opt-icon {
          width:32px; height:32px; border-radius:9px; margin-bottom:8px;
          display:flex; align-items:center; justify-content:center;
        }
        .status-opt-title { font-size:13px; font-weight:700; color:#0f172a; }
        .status-opt-sub   { font-size:11px; color:#94a3b8; margin-top:2px; }

        /* ── Review card ── */
        .review-field {
          padding:12px 0; border-bottom:1px solid #f8fafc;
          display:flex; gap:12px;
        }
        .review-field:last-child { border-bottom:none; }
        .review-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; min-width:120px; }
        .review-val   { font-size:13px; color:#0f172a; font-weight:500; }

        /* ── Nav buttons ── */
        .form-nav {
          display:flex; justify-content:space-between; align-items:center;
          padding:16px 24px; border-top:1px solid #f1f5f9; gap:12px;
        }
        .btn-ghost {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:10px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:13px; font-weight:600; color:#374151;
          cursor:pointer; transition:all .18s; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-ghost:hover { border-color:#7C3AED; color:#7C3AED; }
        .btn-primary {
          display:flex; align-items:center; gap:7px;
          padding:9px 20px; border-radius:10px;
          background:linear-gradient(135deg,#7C3AED,#5b21b6);
          border:none; font-size:13px; font-weight:700; color:#fff;
          cursor:pointer; box-shadow:0 4px 12px rgba(124,58,237,.28);
          transition:transform .18s, box-shadow .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,.36); }
        .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
        .btn-draft {
          display:flex; align-items:center; gap:7px;
          padding:9px 16px; border-radius:10px; border:1.5px solid #e2e8f0;
          background:#fff; font-size:13px; font-weight:600; color:#64748b;
          cursor:pointer; transition:all .18s; font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-draft:hover { border-color:#94a3b8; color:#374151; }

        /* ── Error banner ── */
        .error-banner {
          display:flex; align-items:center; gap:10px;
          padding:12px 16px; background:rgba(239,68,68,.08);
          border:1px solid rgba(239,68,68,.2); border-radius:10px;
          font-size:13px; color:#ef4444; font-weight:500;
          margin:0 24px 16px;
        }

        /* ── Sidebar tips ── */
        .sidebar-tips { display:flex; flex-direction:column; gap:14px; }
        .tip-card {
          background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;
        }
        .tip-card-head {
          padding:14px 16px 10px; border-bottom:1px solid #f1f5f9;
          font-size:12px; font-weight:700; color:#0f172a;
          display:flex; align-items:center; gap:7px;
        }
        .tip-card-body { padding:14px 16px; display:flex; flex-direction:column; gap:10px; }
        .tip-item { display:flex; align-items:flex-start; gap:8px; }
        .tip-dot  {
          width:6px; height:6px; border-radius:50%; background:#7C3AED;
          flex-shrink:0; margin-top:5px;
        }
        .tip-text { font-size:12px; color:#64748b; line-height:1.5; }

        .ai-tip-sidebar {
          background:linear-gradient(135deg,#0f172a,#1e1b4b);
          border-radius:14px; padding:18px; position:relative; overflow:hidden;
        }
        .ai-glow {
          position:absolute; width:100px; height:100px; border-radius:50%;
          background:rgba(124,58,237,.3); filter:blur(35px);
          top:-20px; right:-20px; pointer-events:none;
        }
        .ai-tip-title { font-size:13px; font-weight:700; color:#f1f5f9; margin-bottom:6px; }
        .ai-tip-body  { font-size:12px; color:#94a3b8; line-height:1.55; }

        @media (max-width:640px) {
          .new-job-page { padding:20px 16px 48px; }
          .field-row, .field-row-3 { grid-template-columns:1fr; }
          .form-nav { flex-wrap:wrap; }
        }
      `}</style>

      <div className="new-job-page">
        {/* Back */}
        <Link href="/dashboard/jobs" className="back-link reveal">
          <ArrowLeft size={15} /> Back to Jobs
        </Link>

        <div className="page-title reveal">Post a New Job</div>
        <div className="page-sub reveal">
          Fill in the details below — the more specific you are, the better AI
          can screen candidates.
        </div>

        {/* ── Stepper ── */}
        <div className="stepper reveal">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <div className="step-connector" />}
              <div
                className={`step-item${step === s.id ? " active" : step > s.id ? " done" : ""}`}
              >
                <div className="step-num">
                  {step > s.id ? <CheckCircle2 size={13} /> : s.id}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="form-layout">
          {/* ── Main form card ── */}
          <div className="form-card reveal">
            {/* ════ STEP 1 — Basic Info ════ */}
            {step === 1 && (
              <>
                <div className="card-head">
                  <div className="card-head-icon">
                    <Briefcase size={18} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="card-head-title">Basic Information</div>
                    <div className="card-head-sub">
                      Job title, department and location
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Title */}
                  <div className="field">
                    <label>
                      Job Title <span className="required">*</span>
                    </label>
                    <input
                      className={`inp${errors.title ? " error" : ""}`}
                      placeholder="e.g. Senior Software Engineer"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                    {errors.title && (
                      <span className="field-error">
                        <AlertCircle size={12} /> {errors.title}
                      </span>
                    )}
                  </div>

                  {/* Dept + Location */}
                  <div className="field-row">
                    <div className="field">
                      <label>
                        Department <span className="required">*</span>
                      </label>
                      <div className="sel-wrap">
                        <select
                          className={`sel${errors.department ? " error" : ""}`}
                          value={form.department}
                          onChange={(e) => set("department", e.target.value)}
                        >
                          <option value="">Select department</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="sel-arrow" />
                      </div>
                      {errors.department && (
                        <span className="field-error">
                          <AlertCircle size={12} /> {errors.department}
                        </span>
                      )}
                    </div>
                    <div className="field">
                      <label>
                        Location <span className="required">*</span>
                      </label>
                      <div className="sel-wrap">
                        <select
                          className={`sel${errors.location ? " error" : ""}`}
                          value={form.location}
                          onChange={(e) => set("location", e.target.value)}
                        >
                          <option value="">Select city / mode</option>
                          {CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={15} className="sel-arrow" />
                      </div>
                      {errors.location && (
                        <span className="field-error">
                          <AlertCircle size={12} /> {errors.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employment type */}
                  <div className="field">
                    <label>Employment Type</label>
                    <div className="toggle-chips">
                      {EMP_TYPES.map((t) => (
                        <button
                          key={t.value}
                          className={`t-chip${form.employment_type === t.value ? " active" : ""}`}
                          onClick={() => set("employment_type", t.value)}
                          type="button"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience level */}
                  <div className="field">
                    <label>Experience Level</label>
                    <div className="toggle-chips">
                      {EXP_LEVELS.map((e) => (
                        <button
                          key={e.value}
                          className={`t-chip${form.experience_level === e.value ? " active" : ""}`}
                          onClick={() => set("experience_level", e.value)}
                          type="button"
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="field">
                    <label>
                      Salary Range (PKR / month){" "}
                      <span className="field-hint">— optional</span>
                    </label>
                    <div className="field-row">
                      <div style={{ position: "relative" }}>
                        <span className="salary-prefix">Min</span>
                        <input
                          className="inp has-prefix"
                          placeholder="e.g. 80,000"
                          value={form.salary_min}
                          onChange={(e) => set("salary_min", e.target.value)}
                          type="number"
                        />
                      </div>
                      <div style={{ position: "relative" }}>
                        <span className="salary-prefix">Max</span>
                        <input
                          className="inp has-prefix"
                          placeholder="e.g. 150,000"
                          value={form.salary_max}
                          onChange={(e) => set("salary_max", e.target.value)}
                          type="number"
                        />
                      </div>
                    </div>
                    <span className="field-hint">
                      Showing salary increases applications by 40% on average
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ════ STEP 2 — Job Details ════ */}
            {step === 2 && (
              <>
                <div className="card-head">
                  <div className="card-head-icon">
                    <FileText size={18} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="card-head-title">Job Description</div>
                    <div className="card-head-sub">
                      This becomes the AI's primary context for screening
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Description */}
                  <div className="field">
                    <label>
                      Job Description <span className="required">*</span>
                    </label>
                    <textarea
                      className={`textarea${errors.description ? " error" : ""}`}
                      style={{ minHeight: 180 }}
                      placeholder="Describe the role, the team, and what success looks like in this position. The more detail you provide, the better AI can match candidates..."
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {errors.description ? (
                        <span className="field-error">
                          <AlertCircle size={12} /> {errors.description}
                        </span>
                      ) : (
                        <span className="field-hint">
                          Minimum 100 characters. Be specific about the role.
                        </span>
                      )}
                      <span className="char-count">
                        {form.description.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div className="field">
                    <label>
                      Key Responsibilities{" "}
                      <span className="field-hint">
                        — optional but recommended
                      </span>
                    </label>
                    <textarea
                      className="textarea"
                      placeholder={
                        "• Lead the engineering team of 5 engineers\n• Design and implement scalable backend systems\n• Collaborate with product and design teams\n• Conduct code reviews and mentor junior developers"
                      }
                      value={form.responsibilities}
                      onChange={(e) => set("responsibilities", e.target.value)}
                    />
                    <span className="field-hint">
                      Use bullet points (•) for clarity. AI uses this for
                      candidate ranking.
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ════ STEP 3 — Requirements ════ */}
            {step === 3 && (
              <>
                <div className="card-head">
                  <div className="card-head-icon">
                    <Target size={18} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="card-head-title">Requirements & Skills</div>
                    <div className="card-head-sub">
                      What qualifications and skills are you looking for?
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Requirements */}
                  <div className="field">
                    <label>
                      Requirements <span className="required">*</span>
                    </label>
                    <textarea
                      className={`textarea${errors.requirements ? " error" : ""}`}
                      placeholder={
                        "• Bachelor's degree in Computer Science or related field\n• 3+ years of experience with React and Node.js\n• Strong understanding of REST APIs and databases\n• ACCA / ICMA preferred for finance roles"
                      }
                      value={form.requirements}
                      onChange={(e) => set("requirements", e.target.value)}
                    />
                    {errors.requirements && (
                      <span className="field-error">
                        <AlertCircle size={12} /> {errors.requirements}
                      </span>
                    )}
                    <span className="field-hint">
                      Be specific. Mention degrees, years of experience,
                      certifications (ACCA, PMP, etc.).
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="field">
                    <label>Required Skills</label>
                    <div
                      className="skills-box"
                      onClick={() => skillRef.current?.focus()}
                    >
                      {form.skills.map((s) => (
                        <span key={s} className="skill-tag">
                          {s}
                          <button
                            className="skill-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSkill(s);
                            }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      <input
                        ref={skillRef}
                        className="skill-inp"
                        placeholder={
                          form.skills.length === 0
                            ? "Type a skill and press Enter..."
                            : "Add more..."
                        }
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addSkill(skillInput);
                          }
                          if (
                            e.key === "Backspace" &&
                            !skillInput &&
                            form.skills.length > 0
                          ) {
                            removeSkill(form.skills[form.skills.length - 1]);
                          }
                        }}
                      />
                    </div>
                    <span className="field-hint">
                      Press Enter or comma to add. Backspace to remove last.
                    </span>

                    {/* Suggested skills */}
                    {suggestedSkills.length > 0 && (
                      <div>
                        <span
                          className="field-hint"
                          style={{ display: "block", marginBottom: 6 }}
                        >
                          Suggested for {form.department}:
                        </span>
                        <div className="suggested-skills">
                          {suggestedSkills.map((s) => (
                            <button
                              key={s}
                              className={`sug-btn${form.skills.includes(s) ? " added" : ""}`}
                              onClick={() => addSkill(s)}
                              type="button"
                            >
                              {form.skills.includes(s) ? (
                                <CheckCircle2
                                  size={10}
                                  style={{ marginRight: 3 }}
                                />
                              ) : (
                                <Plus size={10} style={{ marginRight: 3 }} />
                              )}
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publish status */}
                  <div className="field">
                    <label>Publish Status</label>
                    <div className="status-toggle">
                      <div
                        className={`status-opt${form.status === "active" ? " active" : ""}`}
                        onClick={() => set("status", "active")}
                      >
                        <div
                          className="status-opt-icon"
                          style={{ background: "rgba(34,197,94,.1)" }}
                        >
                          <CheckCircle2 size={16} color="#22c55e" />
                        </div>
                        <div className="status-opt-title">Publish Now</div>
                        <div className="status-opt-sub">
                          Job goes live immediately. Candidates can apply via
                          link.
                        </div>
                      </div>
                      <div
                        className={`status-opt${form.status === "draft" ? " active" : ""}`}
                        onClick={() => set("status", "draft")}
                      >
                        <div
                          className="status-opt-icon"
                          style={{ background: "rgba(245,158,11,.1)" }}
                        >
                          <Clock size={16} color="#f59e0b" />
                        </div>
                        <div className="status-opt-title">Save as Draft</div>
                        <div className="status-opt-sub">
                          Save now, publish when ready. Not visible to
                          candidates.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ════ STEP 4 — Review ════ */}
            {step === 4 && (
              <>
                <div className="card-head">
                  <div className="card-head-icon">
                    <CheckCircle2 size={18} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="card-head-title">Review & Post</div>
                    <div className="card-head-sub">
                      Double-check everything before publishing
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {[
                    { label: "Job Title", val: form.title },
                    { label: "Department", val: form.department },
                    { label: "Location", val: form.location },
                    {
                      label: "Employment Type",
                      val: EMP_TYPES.find(
                        (t) => t.value === form.employment_type,
                      )?.label,
                    },
                    {
                      label: "Experience Level",
                      val: EXP_LEVELS.find(
                        (e) => e.value === form.experience_level,
                      )?.label,
                    },
                    {
                      label: "Salary Range",
                      val:
                        form.salary_min && form.salary_max
                          ? `PKR ${parseInt(form.salary_min).toLocaleString()} – ${parseInt(form.salary_max).toLocaleString()} / month`
                          : "Not specified",
                    },
                    {
                      label: "Status",
                      val:
                        form.status === "active"
                          ? "Publish Now"
                          : "Save as Draft",
                    },
                    {
                      label: "Skills",
                      val:
                        form.skills.length > 0
                          ? form.skills.join(", ")
                          : "None added",
                    },
                    {
                      label: "Description",
                      val:
                        form.description.slice(0, 120) +
                        (form.description.length > 120 ? "..." : ""),
                    },
                    {
                      label: "Requirements",
                      val:
                        form.requirements.slice(0, 120) +
                        (form.requirements.length > 120 ? "..." : ""),
                    },
                  ].map(({ label, val }) => (
                    <div key={label} className="review-field">
                      <span className="review-label">{label}</span>
                      <span className="review-val">{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Error banner ── */}
            {submitError && (
              <div className="error-banner">
                <AlertCircle size={16} /> {submitError}
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="form-nav">
              {step > 1 ? (
                <button className="btn-ghost" onClick={prevStep} type="button">
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <Link href="/dashboard/jobs" className="btn-ghost">
                  <ArrowLeft size={14} /> Cancel
                </Link>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                {step === 4 && (
                  <button
                    className="btn-draft"
                    onClick={() => handleSubmit("draft")}
                    disabled={submitting}
                    type="button"
                  >
                    Save as Draft
                  </button>
                )}
                {step < 4 ? (
                  <button
                    className="btn-primary"
                    onClick={nextStep}
                    type="button"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleSubmit("active")}
                    disabled={submitting}
                    type="button"
                  >
                    {submitting ? (
                      "Publishing..."
                    ) : (
                      <>
                        <Zap size={14} /> Publish Job
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar tips ── */}
          <div className="sidebar-tips reveal">
            {/* Writing tips */}
            <div className="tip-card">
              <div className="tip-card-head">
                <Sparkles size={14} color="#7C3AED" />
                Tips for Better Screening
              </div>
              <div className="tip-card-body">
                {[
                  'Be specific about years of experience — "3+ years" beats "experienced".',
                  "Mention Pakistani university preferences (LUMS, IBA, NUST) if relevant.",
                  "List certifications like ACCA, PMP, or CCNA explicitly.",
                  "Include must-have vs nice-to-have skills separately.",
                  "Describe the team size and reporting structure.",
                ].map((tip, i) => (
                  <div key={i} className="tip-item">
                    <div className="tip-dot" />
                    <span className="tip-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI context card */}
            <div className="ai-tip-sidebar">
              <div className="ai-glow" />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Zap size={16} color="#a78bfa" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#a78bfa",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  AI Screening
                </span>
              </div>
              <div className="ai-tip-title">Your JD becomes the AI's brain</div>
              <div className="ai-tip-body">
                SahiScreen feeds your job description directly into the AI
                model. The more context you provide, the more accurately it
                scores candidates against your specific requirements.
              </div>
            </div>

            {/* Stats */}
            <div className="tip-card">
              <div className="tip-card-head">
                <Building2 size={14} color="#7C3AED" />
                Pakistan Hiring Insights
              </div>
              <div className="tip-card-body">
                {[
                  {
                    icon: Users,
                    stat: "68%",
                    text: "of Pakistani candidates apply via WhatsApp-shared links",
                  },
                  {
                    icon: Target,
                    stat: "3.2x",
                    text: "more applications when salary range is shown",
                  },
                  {
                    icon: Zap,
                    stat: "8 min",
                    text: "average time SahiScreen takes to screen 100 CVs",
                  },
                ].map(({ icon: Icon, stat, text }, i) => (
                  <div
                    key={i}
                    className="tip-item"
                    style={{ alignItems: "center" }}
                  >
                    <div
                      style={{
                        minWidth: 42,
                        height: 32,
                        background: "rgba(124,58,237,.08)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={13} color="#7C3AED" />
                    </div>
                    <span className="tip-text">
                      <strong style={{ color: "#0f172a" }}>{stat}</strong>{" "}
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

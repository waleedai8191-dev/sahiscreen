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
import "../../../../Style//Jobs/newjobs.css";
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
  const isSubmitting = useRef(false);

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

      const min = parseInt(form.salary_min);
      const max = parseInt(form.salary_max);

      if (form.salary_min && isNaN(min)) {
        e.salary_min = "Min salary must be a valid number";
      }
      if (form.salary_max && isNaN(max)) {
        e.salary_max = "Max salary must be a valid number";
      }
      if (form.salary_min && form.salary_max && !isNaN(min) && !isNaN(max)) {
        if (min <= 0) {
          e.salary_min = "Min salary must be greater than zero";
        } else if (max <= 0) {
          e.salary_max = "Max salary must be greater than zero";
        } else if (min >= max) {
          e.salary_max = "Max salary must be greater than min salary";
        }
      }
      if (form.salary_max && !form.salary_min) {
        e.salary_min = "Please enter a min salary or remove the max";
      }
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
    if (skillInput.trim()) {
      addSkill(skillInput.trim());
      setSkillInput("");
    }
    if (validate(step)) setStep((s) => s + 1);
  };
  const prevStep = () => {
    if (skillInput.trim()) {
      addSkill(skillInput.trim());
      setSkillInput("");
    }
    setStep((s) => s - 1);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  // ── Sanitize helper — strips HTML tags from plain text fields ──
  const stripHtml = (str: string): string => str.replace(/<[^>]*>/g, "").trim();

  const handleSubmit = async (status: "active" | "draft") => {
    // Synchronous lock — blocks double-click before React re-renders
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    if (skillInput.trim()) {
      addSkill(skillInput.trim());
      setSkillInput("");
    }

    const step1Valid = validate(1);
    const step2Valid = validate(2);
    const step3Valid = validate(3);

    if (!step1Valid || !step2Valid || !step3Valid) {
      isSubmitting.current = false;
      if (!step1Valid) {
        setStep(1);
        return;
      }
      if (!step2Valid) {
        setStep(2);
        return;
      }
      if (!step3Valid) {
        setStep(3);
        return;
      }
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stripHtml(form.title),
          department: stripHtml(form.department),
          location: stripHtml(form.location),
          employment_type: form.employment_type,
          experience_level: form.experience_level,
          salary_min: form.salary_min ? parseInt(form.salary_min) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max) : null,
          salary_currency: form.salary_currency,
          description: stripHtml(form.description),
          requirements: stripHtml(form.requirements),
          responsibilities: stripHtml(form.responsibilities),
          skills: form.skills.map(stripHtml),
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
      isSubmitting.current = false;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      {errors.salary_min && (
                        <span className="field-error">
                          <AlertCircle size={12} /> {errors.salary_min}
                        </span>
                      )}
                      {errors.salary_max && (
                        <span className="field-error">
                          <AlertCircle size={12} /> {errors.salary_max}
                        </span>
                      )}
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
                          ? "✓ Will publish immediately"
                          : "✓ Will save as draft",
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
                    onClick={() => handleSubmit(form.status)}
                    disabled={submitting}
                    type="button"
                  >
                    {submitting ? (
                      form.status === "draft" ? (
                        "Saving..."
                      ) : (
                        "Publishing..."
                      )
                    ) : (
                      <>
                        <Zap size={14} />
                        {form.status === "draft"
                          ? "Save as Draft"
                          : "Publish Job"}
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

"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Building2,
  Zap,
  ArrowRight,
  Users,
  Star,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PublicJob {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience_min: number;
  experience_max: number;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string;
  skills_required: string[];
  slug: string;
  status: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    website: string | null;
  };
}

// ─── Employment type label ────────────────────────────────────────────────────
const empLabel: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApplyPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Fetch job ──
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/apply?slug=${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.job) setNotFound(true);
        else setJob(json.job as PublicJob);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  // ── File handling ──
  const handleFile = (f: File) => {
    setCvError(null);
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setCvError("Only PDF or DOCX files are accepted.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setCvError("File must be under 5 MB.");
      return;
    }
    setCvFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Validate ──
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2)
      errs.fullName = "Please enter your full name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Please enter a valid email address.";
    if (!cvFile) errs.cv = "Please upload your CV.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validate() || !job || !cvFile) return;
    setSubmitting(true);

    try {
      // Convert file to base64 — API route will handle storage upload
      const fileBuffer = await cvFile.arrayBuffer();
      const base64 = Buffer.from(fileBuffer).toString("base64");

      const applyRes = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          candidate_name: fullName.trim(),
          candidate_email: email.trim().toLowerCase(),
          candidate_phone: phone.trim() || null,
          original_filename: cvFile.name,
          file_base64: base64,
          file_type: cvFile.type,
          file_size_kb: Math.round(cvFile.size / 1024),
          source: "apply_link",
        }),
      });

      const applyJson = await applyRes.json();
      if (!applyRes.ok) throw new Error(applyJson.error || "Submission failed");

      router.push(
        `/apply/${slug}/success?name=${encodeURIComponent(fullName.trim())}`,
      );
    } catch (err: any) {
      const isDuplicate = err.message?.includes("already applied");
      setErrors({
        submit: isDuplicate
          ? "You've already submitted an application for this position with this record."
          : (err.message ?? "Something went wrong. Please try again."),
      });
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1C2E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading job…</p>
        </div>
      </div>
    );
  }

  // ── Not found / closed ──
  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-[#0F1C2E] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-white/40" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Job Not Found</h1>
          <p className="text-white/50 mt-2 text-sm max-w-sm">
            This job posting is no longer active or the link is invalid.
          </p>
        </div>
        <div className="w-24 h-px bg-white/10" />
        <p className="text-white/30 text-xs">Powered by SahiScreen</p>
      </div>
    );
  }

  const companyInitials = job.company.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0F1C2E] font-sans">
      {/* ── Subtle grid bg ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(37,99,235,0.08) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)`,
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6">
        {/* ── Company + Job Header ── */}
        <div
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5"
          style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* Company row */}
          <div className="flex items-center gap-3">
            {job.company.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B3A5C] to-[#2563EB] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {companyInitials}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">
                {job.company.name}
              </p>
              {job.company.industry && (
                <p className="text-white/40 text-xs">{job.company.industry}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">
                Hiring
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              <span className="flex items-center gap-1.5 text-white/50 text-sm">
                <MapPin className="w-3.5 h-3.5 text-white/30" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-white/50 text-sm">
                <Briefcase className="w-3.5 h-3.5 text-white/30" />
                {empLabel[job.employment_type] ?? job.employment_type}
              </span>
              <span className="flex items-center gap-1.5 text-white/50 text-sm">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                {job.experience_level ?? "Any"} level
              </span>
              {job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1.5 text-white/50 text-sm">
                  <Briefcase className="w-3.5 h-3.5 text-white/30" />
                  PKR {job.salary_min.toLocaleString()} –{" "}
                  {job.salary_max.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.skills_required.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/8 border border-white/10 text-white/70 text-xs font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Job Description ── */}
        <div
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden"
          style={{
            animation: "fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <details className="group">
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none select-none">
              <span className="text-white/80 font-semibold text-sm">
                About this Role
              </span>
              <ChevronDown className="w-4 h-4 text-white/40 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-white/8 pt-4">
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
              {job.requirements && (
                <div>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                    Requirements
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* ── Apply Form ── */}
        <div
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
          style={{
            animation: "fadeUp 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">Apply Now</h2>
            <p className="text-white/40 text-sm mt-1">
              No account needed. Takes under 60 seconds.
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((p) => ({ ...p, fullName: "" }));
              }}
              placeholder="e.g. Ahmad Hassan"
              className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.fullName
                  ? "border-red-500/50 focus:ring-red-500/30"
                  : "border-white/10 focus:ring-white/20 focus:border-white/25"
              }`}
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="you@example.com"
              className={`w-full bg-white/8 border rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-red-500/50 focus:ring-red-500/30"
                  : "border-white/10 focus:ring-white/20 focus:border-white/25"
              }`}
            />
            {errors.email && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Phone{" "}
              <span className="text-white/25 font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 0000000"
              className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/25 transition-all"
            />
          </div>

          {/* CV Upload */}
          <div className="space-y-1.5">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">
              Your CV <span className="text-red-400">*</span>
            </label>

            {!cvFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragging
                    ? "border-blue-400/60 bg-blue-500/10"
                    : errors.cv
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-white/15 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    dragging ? "bg-blue-500/20" : "bg-white/8"
                  }`}
                >
                  <Upload
                    className={`w-5 h-5 ${dragging ? "text-blue-400" : "text-white/40"}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm font-medium">
                    {dragging ? "Drop your CV here" : "Upload your CV"}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    PDF or DOCX · Max 5 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/8 border border-white/15 rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {cvFile.name}
                  </p>
                  <p className="text-white/40 text-xs">
                    {(cvFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to
                    submit
                  </p>
                </div>
                <button
                  onClick={() => setCvFile(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {(errors.cv || cvError) && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.cv || cvError}
              </p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all ${
              submitting
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Application…
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-white/25 text-xs">
            Your information is only shared with {job.company.name} and used for
            this application.
          </p>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-center gap-2 py-2"
          style={{
            animation: "fadeUp 0.5s 0.35s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#1B3A5C] to-[#2563EB] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/30 text-xs">Powered by</span>
            <span className="text-white/50 text-xs font-semibold">
              SahiScreen
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        details[open] summary .rotate-180 {
          transform: rotate(180deg);
        }
        .bg-white\/8 {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .border-white\/8 {
          border-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

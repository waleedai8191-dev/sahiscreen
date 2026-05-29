"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Zap,
  Users,
  Clock,
  RefreshCw,
  Eye,
  Briefcase,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

interface FileItem {
  id: string;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
  candidateId?: string;
}

interface Job {
  id: string;
  title: string;
  department: string;
  slug: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXT = [".pdf", ".docx"];
const MAX_FILES = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function validateFile(file: File): string | null {
  if (
    !ACCEPTED_TYPES.includes(file.type) &&
    !ACCEPTED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext))
  ) {
    return "Only PDF and DOCX files are accepted";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be under ${MAX_FILE_SIZE_MB}MB`;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadCVsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createSupabaseBrowserClient();

  const [job, setJob] = useState<Job | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [companyId, setCompanyId] = useState<string>("");
  const [cvQuota, setCvQuota] = useState<{
    used: number;
    limit: number;
  } | null>(null);
  const [globalError, setGlobalError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ── Fetch job + quota ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/jobs/${id}`);
      const json = await res.json();
      if (json.job) setJob(json.job as Job);
      if (json.companyId) setCompanyId(json.companyId);
      if (json.quota) {
        setCvQuota({
          used: json.quota.used ?? 0,
          limit: json.quota.limit ?? 50,
        });
      }
    })();
  }, [id]);

  // ── Add files ──────────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const remaining = MAX_FILES - files.length;

      if (remaining <= 0) {
        setGlobalError(`Maximum ${MAX_FILES} files per upload batch.`);
        return;
      }

      const toAdd: FileItem[] = [];
      arr.slice(0, remaining).forEach((file) => {
        const err = validateFile(file);
        // Avoid duplicates by name+size
        const isDupe = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size,
        );
        if (!isDupe) {
          toAdd.push({
            id: generateId(),
            file,
            status: err ? "error" : "queued",
            progress: 0,
            error: err ?? undefined,
          });
        }
      });

      setFiles((prev) => [...prev, ...toAdd]);
      setGlobalError("");
    },
    [files],
  );

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (fileId: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== fileId));

  const clearAll = () => {
    setFiles([]);
    setUploadStatus("idle");
    setUploadedCount(0);
    setErrorCount(0);
  };

  // ── Upload all ─────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const validFiles = files.filter((f) => f.status === "queued");
    if (!validFiles.length || !companyId || !job) return;

    // Quota check
    if (cvQuota && cvQuota.used + validFiles.length > cvQuota.limit) {
      setGlobalError(
        `Uploading ${validFiles.length} CVs would exceed your monthly limit of ${cvQuota.limit}. ` +
          `You have ${cvQuota.limit - cvQuota.used} remaining.`,
      );
      return;
    }

    setUploadStatus("uploading");
    setGlobalError("");
    let uploaded = 0;
    let errors = 0;

    for (const item of validFiles) {
      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "uploading", progress: 10 } : f,
        ),
      );

      try {
        // 1. Upload file to Supabase Storage
        const ext = item.file.name.split(".").pop();
        const filePath = `${companyId}/${job.id}/${generateId()}.${ext}`;

        const { error: storageErr } = await supabase.storage
          .from("cvs")
          .upload(filePath, item.file, { cacheControl: "3600", upsert: false });

        if (storageErr) throw new Error(storageErr.message);

        // Progress: 50%
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: 50 } : f)),
        );

        // 2. Get public URL
        const { data: urlData } = supabase.storage
          .from("cvs")
          .getPublicUrl(filePath);

        // 3. Insert candidate record
        // 3. Insert candidate record into cv_uploads (correct table)
        const { data: candidate, error: dbErr } = await supabase
          .from("cv_uploads")
          .insert({
            job_id: job.id,
            company_id: companyId,
            candidate_name: item.file.name.replace(/\.(pdf|docx)$/i, ""),
            candidate_email: "",
            cv_url: urlData.publicUrl,
            file_path: filePath,
            original_filename: item.file.name,
            file_size_kb: Math.round(item.file.size / 1024),
            file_type: item.file.name.toLowerCase().endsWith(".pdf")
              ? "pdf"
              : "docx",
            status: "new",
            screening_status: "pending",
            source: "manual",
          })
          .select("id")
          .single();

        if (dbErr) throw new Error(dbErr.message);

        // Progress: 100%
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "uploaded",
                  progress: 100,
                  candidateId: candidate?.id,
                }
              : f,
          ),
        );

        uploaded++;
        setUploadedCount(uploaded);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", progress: 0, error: msg }
              : f,
          ),
        );
        errors++;
        setErrorCount(errors);
      }
    }

    // 4. Trigger AI screening via API
    if (uploaded > 0) {
      setUploadStatus("processing");
      try {
        await fetch("/api/screening/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, companyId }),
        });
      } catch {
        // Screening trigger failed — not critical, will retry automatically
      }
    }

    setUploadStatus(errors > 0 && uploaded === 0 ? "error" : "done");
  };

  // ── Computed ───────────────────────────────────────────────────────────────

  const validCount = files.filter((f) => f.status === "queued").length;
  const invalidCount = files.filter(
    (f) => f.status === "error" && !f.candidateId,
  ).length;
  const doneCount = files.filter((f) => f.status === "uploaded").length;
  const quotaLeft = cvQuota ? cvQuota.limit - cvQuota.used : null;
  const quotaPct = cvQuota
    ? Math.min((cvQuota.used / cvQuota.limit) * 100, 100)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        .upload-page {
          min-height: 100%; background: #f8fafc;
          padding: 28px 32px 60px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        .reveal { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
        .r1{animation-delay:.04s} .r2{animation-delay:.10s}
        .r3{animation-delay:.16s} .r4{animation-delay:.22s}

        /* ── Back ── */
        .back-link {
          display:inline-flex; align-items:center; gap:7px;
          font-size:13px; font-weight:600; color:#64748b;
          text-decoration:none; margin-bottom:18px; transition:color .18s;
        }
        .back-link:hover { color:#7C3AED; }

        /* ── Page header ── */
        .page-header {
          display:flex; align-items:flex-start; justify-content:space-between;
          gap:16px; margin-bottom:24px; flex-wrap:wrap;
        }
        .page-title { font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-.4px; }
        .page-sub   { font-size:13px; color:#64748b; margin-top:3px; font-weight:500; }

        /* ── Job pill ── */
        .job-pill {
          display:inline-flex; align-items:center; gap:8px;
          padding:8px 14px; background:#fff; border:1px solid #e2e8f0;
          border-radius:10px; font-size:13px; font-weight:600; color:#0f172a;
          text-decoration:none; transition:border-color .2s;
        }
        .job-pill:hover { border-color:#7C3AED; }

        /* ── Layout ── */
        .upload-layout {
          display:grid; grid-template-columns:1fr 300px;
          gap:20px; align-items:start;
        }
        @media (max-width:900px) {
          .upload-layout { grid-template-columns:1fr; }
          .upload-sidebar { order:99; }
        }

        /* ── Card ── */
        .card {
          background:#fff; border:1px solid #e2e8f0;
          border-radius:16px; overflow:hidden;
        }
        .card-head {
          padding:18px 22px 14px; border-bottom:1px solid #f1f5f9;
          display:flex; align-items:center; gap:10px;
        }
        .card-head-icon {
          width:36px; height:36px; border-radius:10px;
          background:rgba(124,58,237,.1);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .card-head-title { font-size:14px; font-weight:700; color:#0f172a; }
        .card-head-sub   { font-size:12px; color:#94a3b8; margin-top:1px; }

        /* ── Drop zone ── */
        .drop-zone {
          margin:20px; border:2px dashed #e2e8f0; border-radius:14px;
          padding:44px 24px; text-align:center; cursor:pointer;
          transition:border-color .2s, background .2s;
          position:relative;
        }
        .drop-zone:hover, .drop-zone.dragging {
          border-color:#7C3AED; background:rgba(124,58,237,.03);
        }
        .drop-zone.dragging { background:rgba(124,58,237,.06); }

        .drop-icon {
          width:56px; height:56px; border-radius:16px;
          background:rgba(124,58,237,.1);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 14px;
        }
        .drop-title { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:5px; }
        .drop-sub   { font-size:13px; color:#94a3b8; margin-bottom:16px; }
        .drop-constraints {
          display:flex; justify-content:center; gap:16px; flex-wrap:wrap;
        }
        .constraint-chip {
          display:flex; align-items:center; gap:5px;
          font-size:11px; font-weight:600; color:#64748b;
          background:#f8fafc; border:1px solid #e2e8f0;
          padding:4px 10px; border-radius:20px;
        }
        .browse-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:9px 20px; border-radius:10px;
          background:linear-gradient(135deg,#7C3AED,#5b21b6);
          border:none; font-size:13px; font-weight:700; color:#fff;
          cursor:pointer; box-shadow:0 4px 12px rgba(124,58,237,.28);
          transition:transform .18s, box-shadow .18s;
          font-family:'Plus Jakarta Sans',sans-serif; margin-bottom:14px;
        }
        .browse-btn:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,.36); }

        /* ── File list ── */
        .file-list-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 22px 10px; border-top:1px solid #f1f5f9;
        }
        .file-list-title {
          font-size:13px; font-weight:700; color:#0f172a;
        }
        .clear-btn {
          font-size:12px; font-weight:600; color:#94a3b8;
          background:none; border:none; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;
          transition:color .15s; padding:0;
        }
        .clear-btn:hover { color:#ef4444; }

        .file-list { max-height:360px; overflow-y:auto; padding:0 22px 16px; }
        .file-list::-webkit-scrollbar { width:4px; }
        .file-list::-webkit-scrollbar-track { background:transparent; }
        .file-list::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }

        .file-item {
          display:flex; align-items:center; gap:12px;
          padding:10px 0; border-bottom:1px solid #f8fafc;
        }
        .file-item:last-child { border-bottom:none; }

        .file-icon {
          width:36px; height:36px; border-radius:9px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .file-info { flex:1; min-width:0; }
        .file-name {
          font-size:13px; font-weight:600; color:#0f172a;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .file-meta {
          display:flex; align-items:center; gap:7px; margin-top:2px;
        }
        .file-size { font-size:11px; color:#94a3b8; }
        .file-err  { font-size:11px; color:#ef4444; font-weight:500; }

        /* progress bar */
        .file-progress {
          height:3px; background:#f1f5f9; border-radius:99px;
          margin-top:5px; overflow:hidden;
        }
        .file-progress-fill {
          height:100%; border-radius:99px;
          background:linear-gradient(90deg,#7C3AED,#a78bfa);
          transition:width .3s ease;
        }

        .file-status-icon { flex-shrink:0; }
        .remove-btn {
          width:26px; height:26px; border-radius:7px; border:none;
          background:rgba(239,68,68,.08); color:#ef4444;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; flex-shrink:0; transition:background .15s;
        }
        .remove-btn:hover { background:rgba(239,68,68,.15); }

        /* ── Summary bar ── */
        .summary-bar {
          display:flex; align-items:center; gap:16px;
          padding:14px 22px; background:#f8fafc;
          border-top:1px solid #e2e8f0; flex-wrap:wrap;
        }
        .summary-chip {
          display:flex; align-items:center; gap:5px;
          font-size:12px; font-weight:600;
        }

        /* ── Upload action bar ── */
        .action-bar {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 22px; border-top:1px solid #f1f5f9; gap:12px; flex-wrap:wrap;
        }
        .upload-btn {
          display:flex; align-items:center; gap:8px;
          padding:10px 24px; border-radius:10px;
          background:linear-gradient(135deg,#7C3AED,#5b21b6);
          border:none; font-size:14px; font-weight:700; color:#fff;
          cursor:pointer; box-shadow:0 4px 14px rgba(124,58,237,.3);
          transition:transform .18s, box-shadow .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .upload-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,.38); }
        .upload-btn:disabled { opacity:.55; cursor:not-allowed; }

        .btn-ghost {
          display:flex; align-items:center; gap:7px; padding:10px 16px;
          border-radius:10px; border:1.5px solid #e2e8f0; background:#fff;
          font-size:13px; font-weight:600; color:#374151; cursor:pointer;
          text-decoration:none; transition:all .18s;
          font-family:'Plus Jakarta Sans',sans-serif;
        }
        .btn-ghost:hover { border-color:#7C3AED; color:#7C3AED; }

        /* ── Error banner ── */
        .error-banner {
          display:flex; align-items:flex-start; gap:10px;
          margin:0 22px 16px; padding:12px 14px;
          background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.2);
          border-radius:10px; font-size:13px; color:#ef4444; font-weight:500;
          line-height:1.5;
        }

        /* ── Done state ── */
        .done-banner {
          margin:20px; padding:20px;
          background:linear-gradient(135deg,rgba(34,197,94,.07),rgba(34,197,94,.03));
          border:1px solid rgba(34,197,94,.2); border-radius:14px;
          text-align:center;
        }
        .done-icon {
          width:52px; height:52px; border-radius:16px; background:rgba(34,197,94,.12);
          display:flex; align-items:center; justify-content:center; margin:0 auto 12px;
        }
        .done-title { font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; }
        .done-sub   { font-size:13px; color:#64748b; margin-bottom:16px; }
        .done-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

        /* processing state */
        .processing-banner {
          margin:20px; padding:20px;
          background:linear-gradient(135deg,rgba(124,58,237,.07),rgba(91,33,182,.03));
          border:1px solid rgba(124,58,237,.2); border-radius:14px;
          text-align:center;
        }
        .processing-title { font-size:15px; font-weight:700; color:#5b21b6; margin-bottom:4px; }
        .processing-sub   { font-size:13px; color:#7C3AED; }
        .spinning { animation:spin 1.2s linear infinite; }

        /* ── Sidebar ── */
        .sidebar-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; margin-bottom:14px; }
        .sc-head {
          padding:14px 16px 10px; border-bottom:1px solid #f1f5f9;
          font-size:12px; font-weight:700; color:#0f172a;
          display:flex; align-items:center; gap:7px;
        }
        .sc-body { padding:14px 16px; }

        /* quota bar */
        .quota-row { display:flex; justify-content:space-between; margin-bottom:6px; }
        .quota-label { font-size:12px; font-weight:600; color:#64748b; }
        .quota-count { font-size:12px; font-weight:700; color:#0f172a; }
        .quota-track { height:6px; background:#f1f5f9; border-radius:99px; overflow:hidden; margin-bottom:6px; }
        .quota-fill  { height:100%; border-radius:99px; transition:width .6s ease; }
        .quota-hint  { font-size:11px; color:#94a3b8; }

        /* tips */
        .tip-item { display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; }
        .tip-dot  { width:6px; height:6px; border-radius:50%; background:#7C3AED; flex-shrink:0; margin-top:5px; }
        .tip-text { font-size:12px; color:#64748b; line-height:1.5; }

        /* dark AI card */
        .ai-dark-card {
          background:linear-gradient(135deg,#0f172a,#1e1b4b);
          border-radius:14px; padding:18px; position:relative; overflow:hidden;
        }
        .ai-glow {
          position:absolute; width:100px; height:100px; border-radius:50%;
          background:rgba(124,58,237,.3); filter:blur(35px);
          top:-20px; right:-20px; pointer-events:none;
        }
        .ai-dark-label {
          display:inline-flex; align-items:center; gap:5px; margin-bottom:10px;
          background:rgba(124,58,237,.25); border:1px solid rgba(124,58,237,.35);
          border-radius:20px; padding:3px 10px;
          font-size:10px; font-weight:700; color:#a78bfa;
          text-transform:uppercase; letter-spacing:.06em;
        }
        .ai-dark-title { font-size:13px; font-weight:700; color:#f1f5f9; margin-bottom:6px; }
        .ai-dark-body  { font-size:12px; color:#94a3b8; line-height:1.55; }

        @media (max-width:640px) {
          .upload-page { padding:20px 16px 48px; }
          .drop-zone   { padding:32px 16px; }
        }
      `}</style>

      <div className="upload-page">
        {/* Back */}
        <Link href={`/dashboard/jobs/${id}`} className="back-link reveal r1">
          <ArrowLeft size={15} /> Back to Job
        </Link>

        {/* Header */}
        <div className="page-header reveal r1">
          <div>
            <div className="page-title">Upload CVs</div>
            <div className="page-sub">
              Bulk upload candidate CVs — AI will screen and rank them
              automatically
            </div>
          </div>
          {job && (
            <Link href={`/dashboard/jobs/${job.id}`} className="job-pill">
              <Briefcase size={14} color="#7C3AED" />
              {job.title}
            </Link>
          )}
        </div>

        <div className="upload-layout">
          {/* ── Main upload card ── */}
          <div className="reveal r2">
            {/* ── Done state ── */}
            {uploadStatus === "done" && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="done-banner">
                  <div className="done-icon">
                    <CheckCircle2 size={24} color="#22c55e" />
                  </div>
                  <div className="done-title">
                    {uploadedCount} CV{uploadedCount !== 1 ? "s" : ""} uploaded
                    successfully!
                  </div>
                  <div className="done-sub">
                    AI screening has started. Results will appear in the
                    job&apos;s candidate list shortly.
                    {errorCount > 0 &&
                      ` (${errorCount} file${errorCount !== 1 ? "s" : ""} failed)`}
                  </div>
                  <div className="done-actions">
                    <Link
                      href={`/dashboard/jobs/${id}`}
                      className="upload-btn"
                      style={{ textDecoration: "none" }}
                    >
                      <Eye size={14} /> View Candidates
                    </Link>
                    <button className="btn-ghost" onClick={clearAll}>
                      <Upload size={13} /> Upload More
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Processing state ── */}
            {uploadStatus === "processing" && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="processing-banner">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "rgba(124,58,237,.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RefreshCw
                        size={22}
                        color="#7C3AED"
                        className="spinning"
                      />
                    </div>
                  </div>
                  <div className="processing-title">
                    Triggering AI Screening...
                  </div>
                  <div className="processing-sub">
                    CVs uploaded. AI is now queuing them for screening.
                  </div>
                </div>
              </div>
            )}

            {/* ── Main upload card ── */}
            {(uploadStatus === "idle" ||
              uploadStatus === "uploading" ||
              uploadStatus === "error") && (
              <div className="card">
                <div className="card-head">
                  <div className="card-head-icon">
                    <Upload size={17} color="#7C3AED" />
                  </div>
                  <div>
                    <div className="card-head-title">Bulk CV Upload</div>
                    <div className="card-head-sub">
                      PDF and DOCX files · Max {MAX_FILE_SIZE_MB}MB each · Up to{" "}
                      {MAX_FILES} files
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  ref={dropZoneRef}
                  className={`drop-zone${isDragging ? " dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileInput}
                  />
                  <div className="drop-icon">
                    <Upload size={24} color="#7C3AED" />
                  </div>
                  <div className="drop-title">
                    {isDragging
                      ? "Drop files here"
                      : "Drag & drop CV files here"}
                  </div>
                  <div className="drop-sub">
                    or click to browse your computer
                  </div>
                  <button
                    className="browse-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    type="button"
                  >
                    <Upload size={14} /> Browse Files
                  </button>
                  <div className="drop-constraints">
                    <span className="constraint-chip">
                      <FileText size={11} /> PDF & DOCX only
                    </span>
                    <span className="constraint-chip">
                      <AlertCircle size={11} /> Max {MAX_FILE_SIZE_MB}MB per
                      file
                    </span>
                    <span className="constraint-chip">
                      <Users size={11} /> Up to {MAX_FILES} files
                    </span>
                  </div>
                </div>

                {/* Global error */}
                {globalError && (
                  <div className="error-banner">
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />{" "}
                    {globalError}
                  </div>
                )}

                {/* File list */}
                {files.length > 0 && (
                  <>
                    <div className="file-list-header">
                      <span className="file-list-title">
                        {files.length} file{files.length !== 1 ? "s" : ""}{" "}
                        selected
                      </span>
                      <button className="clear-btn" onClick={clearAll}>
                        Clear all
                      </button>
                    </div>

                    <div className="file-list">
                      {files.map((item) => {
                        const isPdf = item.file.name
                          .toLowerCase()
                          .endsWith(".pdf");
                        const isErr = item.status === "error";
                        const isDone = item.status === "uploaded";
                        const isUpl = item.status === "uploading";

                        return (
                          <div key={item.id} className="file-item">
                            {/* Icon */}
                            <div
                              className="file-icon"
                              style={{
                                background: isErr
                                  ? "rgba(239,68,68,.1)"
                                  : isDone
                                    ? "rgba(34,197,94,.1)"
                                    : "rgba(124,58,237,.08)",
                              }}
                            >
                              <FileText
                                size={17}
                                color={
                                  isErr
                                    ? "#ef4444"
                                    : isDone
                                      ? "#22c55e"
                                      : "#7C3AED"
                                }
                              />
                            </div>

                            {/* Info */}
                            <div className="file-info">
                              <div className="file-name">{item.file.name}</div>
                              <div className="file-meta">
                                <span className="file-size">
                                  {formatFileSize(item.file.size)}
                                </span>
                                {isErr && item.error && (
                                  <>
                                    <span
                                      style={{ color: "#cbd5e1", fontSize: 10 }}
                                    >
                                      ·
                                    </span>
                                    <span className="file-err">
                                      {item.error}
                                    </span>
                                  </>
                                )}
                                {isDone && (
                                  <>
                                    <span
                                      style={{ color: "#cbd5e1", fontSize: 10 }}
                                    >
                                      ·
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#16a34a",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Uploaded
                                    </span>
                                  </>
                                )}
                              </div>
                              {isUpl && (
                                <div className="file-progress">
                                  <div
                                    className="file-progress-fill"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Status icon */}
                            <div className="file-status-icon">
                              {isDone && (
                                <CheckCircle2 size={16} color="#22c55e" />
                              )}
                              {isErr && (
                                <AlertCircle size={16} color="#ef4444" />
                              )}
                              {isUpl && (
                                <RefreshCw
                                  size={16}
                                  color="#7C3AED"
                                  className="spinning"
                                />
                              )}
                            </div>

                            {/* Remove */}
                            {item.status === "queued" && (
                              <button
                                className="remove-btn"
                                onClick={() => removeFile(item.id)}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary bar */}
                    <div className="summary-bar">
                      {validCount > 0 && (
                        <span
                          className="summary-chip"
                          style={{ color: "#7C3AED" }}
                        >
                          <Clock size={13} /> {validCount} ready to upload
                        </span>
                      )}
                      {invalidCount > 0 && (
                        <span
                          className="summary-chip"
                          style={{ color: "#ef4444" }}
                        >
                          <AlertCircle size={13} /> {invalidCount} invalid
                        </span>
                      )}
                      {doneCount > 0 && (
                        <span
                          className="summary-chip"
                          style={{ color: "#22c55e" }}
                        >
                          <CheckCircle2 size={13} /> {doneCount} uploaded
                        </span>
                      )}
                    </div>

                    {/* Action bar */}
                    <div className="action-bar">
                      <Link
                        href={`/dashboard/jobs/${id}`}
                        className="btn-ghost"
                      >
                        <ArrowLeft size={13} /> Cancel
                      </Link>
                      <button
                        className="upload-btn"
                        onClick={handleUpload}
                        disabled={
                          validCount === 0 || uploadStatus === "uploading"
                        }
                      >
                        {uploadStatus === "uploading" ? (
                          <>
                            <RefreshCw size={14} className="spinning" />{" "}
                            Uploading {uploadedCount}/{validCount}...
                          </>
                        ) : (
                          <>
                            <Zap size={14} /> Upload & Screen {validCount} CV
                            {validCount !== 1 ? "s" : ""}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Empty drop zone hint */}
                {files.length === 0 && uploadStatus === "idle" && (
                  <div
                    style={{
                      padding: "0 22px 20px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      💡 Tip: You can also ZIP multiple CVs and upload them at
                      once
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="upload-sidebar reveal r3">
            {/* CV Quota */}
            {cvQuota && (
              <div className="sidebar-card">
                <div className="sc-head">
                  <Zap size={13} color="#7C3AED" /> CV Screening Quota
                </div>
                <div className="sc-body">
                  <div className="quota-row">
                    <span className="quota-label">Used this period</span>
                    <span className="quota-count">
                      {cvQuota.used} / {cvQuota.limit}
                    </span>
                  </div>
                  <div className="quota-track">
                    <div
                      className="quota-fill"
                      style={{
                        width: `${quotaPct}%`,
                        background:
                          quotaPct >= 90
                            ? "#ef4444"
                            : quotaPct >= 75
                              ? "#f59e0b"
                              : "#7C3AED",
                      }}
                    />
                  </div>
                  <div className="quota-hint">
                    {quotaLeft !== null
                      ? `${quotaLeft} CV${quotaLeft !== 1 ? "s" : ""} remaining this billing period`
                      : "Loading quota..."}
                  </div>
                  {quotaPct >= 80 && (
                    <Link
                      href="/dashboard/billing"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#7C3AED",
                        textDecoration: "none",
                      }}
                    >
                      <Zap size={12} /> Upgrade for more →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Upload tips */}
            <div className="sidebar-card">
              <div className="sc-head">
                <Info size={13} color="#7C3AED" /> Upload Tips
              </div>
              <div className="sc-body">
                {[
                  "Name CV files clearly (e.g. John-Ali-CV.pdf) for better tracking.",
                  "PDF format gives the most accurate AI extraction.",
                  "Remove password-protected files before uploading.",
                  "You can upload up to 500 CVs in a single batch.",
                  "AI screening begins automatically after upload completes.",
                ].map((tip, i) => (
                  <div key={i} className="tip-item">
                    <div className="tip-dot" />
                    <span className="tip-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI card */}
            <div className="ai-dark-card">
              <div className="ai-glow" />
              <div className="ai-dark-label">
                <Zap size={10} /> AI Screening
              </div>
              <div className="ai-dark-title">What happens after upload?</div>
              <div className="ai-dark-body">
                Each CV is parsed, scored 0–100 against your job description,
                and ranked. Strengths, red flags, and a justification are
                generated for every candidate. Results appear in minutes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

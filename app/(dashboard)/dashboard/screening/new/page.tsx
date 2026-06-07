"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Plus,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function NewScreeningPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // ── Step 1: Create session ────────────────────────────────────────────────

  const handleCreateSession = async () => {
    if (!name.trim()) {
      setError("Session name is required");
      return;
    }
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/blind-screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          job_requirements: jobRequirements.trim() || null,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create session");
        return;
      }
      setSessionId(data.session.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // ── Step 2: Upload files ──────────────────────────────────────────────────

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadFile = async (file: File, fileId: string) => {
    if (!sessionId) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f)),
    );

    try {
      const base64 = await toBase64(file);
      const res = await fetch(`/api/blind-screening/${sessionId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_base64: base64,
          original_filename: file.name,
          file_type: file.type,
          file_size_kb: Math.round(file.size / 1024),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: "error", error: data.error ?? "Upload failed" }
              : f,
          ),
        );
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "done" } : f)),
        );
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "error", error: "Network error" }
            : f,
        ),
      );
    }
  };

  const addFiles = async (newFiles: FileList | File[]) => {
    if (!sessionId) return;
    const arr = Array.from(newFiles).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.endsWith(".pdf") ||
        f.name.endsWith(".docx"),
    );

    const entries: UploadedFile[] = arr.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...entries]);

    for (let i = 0; i < arr.length; i++) {
      await uploadFile(arr[i], entries[i].id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (sessionId) addFiles(e.dataTransfer.files);
  };

  // ── Step 3: Trigger AI screening ─────────────────────────────────────────

  const handleTriggerScreening = async () => {
    if (!sessionId) return;
    const readyCount = files.filter((f) => f.status === "done").length;
    if (readyCount === 0) {
      setError("Upload at least one CV first");
      return;
    }

    setTriggering(true);
    setError("");

    try {
      const res = await fetch(`/api/blind-screening/${sessionId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to trigger screening");
        return;
      }

      setDone(true);
      setTimeout(() => router.push(`/dashboard/screening/${sessionId}`), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setTriggering(false);
    }
  };

  const uploadedCount = files.filter((f) => f.status === "done").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .new-sc-page {
          min-height: 100%; background: #f8fafc;
          padding: 28px 32px 60px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .reveal { animation: fadeUp .38s cubic-bezier(.22,1,.36,1) both; }
        .r1 { animation-delay: .04s; } .r2 { animation-delay: .10s; }
        .r3 { animation-delay: .16s; }

        .back-link {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 600; color: #64748b;
          text-decoration: none; margin-bottom: 20px; transition: color .18s;
        }
        .back-link:hover { color: #7C3AED; }

        .section-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 24px 26px; margin-bottom: 18px;
        }
        .section-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .section-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }

        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a; background: #fff; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .form-input::placeholder { color: #94a3b8; }
        .form-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,.08); }
        .form-textarea { resize: vertical; min-height: 80px; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 10px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          border: none; font-size: 13px; font-weight: 700; color: #fff;
          cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,.28);
          transition: transform .18s, box-shadow .18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,58,237,.36); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #fff;
          font-size: 13px; font-weight: 600; color: #374151;
          cursor: pointer; transition: all .18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .btn-outline:hover { border-color: #7C3AED; color: #7C3AED; }

        .step-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          color: #fff; font-size: 12px; font-weight: 800;
          margin-right: 10px; flex-shrink: 0;
        }
        .step-header { display: flex; align-items: center; margin-bottom: 4px; }

        .drop-zone {
          border: 2px dashed #e2e8f0; border-radius: 12px;
          padding: 36px 24px; text-align: center;
          cursor: pointer; transition: all .2s;
        }
        .drop-zone:hover, .drop-zone.dragging {
          border-color: #7C3AED; background: rgba(124,58,237,.03);
        }
        .drop-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(124,58,237,.1);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
        }
        .drop-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .drop-sub { font-size: 12px; color: #94a3b8; }

        .file-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .file-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 10px;
        }
        .file-name { flex: 1; font-size: 13px; color: #0f172a; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: 11px; color: #94a3b8; flex-shrink: 0; }
        .file-status { flex-shrink: 0; }

        .spinning { animation: spin 1s linear infinite; }

        .error-box {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; background: rgba(239,68,68,.06);
          border: 1px solid rgba(239,68,68,.2); border-radius: 10px;
          font-size: 13px; color: #dc2626; font-weight: 500;
          margin-bottom: 16px;
        }

        .success-box {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 20px; background: rgba(34,197,94,.06);
          border: 1px solid rgba(34,197,94,.2); border-radius: 12px;
          font-size: 14px; color: #16a34a; font-weight: 600;
        }

        .disabled-overlay {
          opacity: 0.5; pointer-events: none; user-select: none;
        }

        @media (max-width: 640px) {
          .new-sc-page { padding: 20px 16px 48px; }
        }
      `}</style>

      <div className="new-sc-page">
        <Link href="/dashboard/screening" className="back-link reveal r1">
          <ArrowLeft size={15} /> Back to Screening
        </Link>

        {error && (
          <div className="error-box reveal r1">
            <AlertCircle size={16} color="#ef4444" />
            {error}
          </div>
        )}

        {done && (
          <div className="success-box reveal r1">
            <CheckCircle2 size={18} color="#16a34a" />
            Screening triggered! Redirecting to results...
          </div>
        )}

        {/* ── Step 1: Session details ── */}
        <div className="section-card reveal r1">
          <div className="step-header">
            <span className="step-badge">1</span>
            <div className="section-title">Session Details</div>
          </div>
          <div className="section-sub">
            Give this screening session a name so you can find it later.
          </div>

          <div className="form-group">
            <label className="form-label">Session Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Senior Engineers — June 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!sessionId}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Job Requirements{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                (optional — if provided, AI scores CVs against these)
              </span>
            </label>
            <textarea
              className="form-input form-textarea"
              style={{ minHeight: 110 }}
              placeholder={`e.g. Looking for a Senior React Developer with:\n- 3+ years React and TypeScript\n- Experience with Node.js or Next.js\n- Pakistani fintech or SaaS background preferred\n- Strong communication skills`}
              value={jobRequirements}
              onChange={(e) => setJobRequirements(e.target.value)}
              disabled={!!sessionId}
            />
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 500,
                marginTop: 5,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              Leave empty for general CV assessment without specific
              requirements
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Any notes about this screening batch..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!!sessionId}
            />
          </div>

          {!sessionId ? (
            <button
              className="btn-primary"
              onClick={handleCreateSession}
              disabled={creating || !name.trim()}
            >
              {creating ? (
                <>
                  <Loader2 size={14} className="spinning" /> Creating...
                </>
              ) : (
                <>
                  <Plus size={14} /> Create Session
                </>
              )}
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#16a34a",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} color="#16a34a" />
              Session created — now upload your CVs
            </div>
          )}
        </div>

        {/* ── Step 2: Upload CVs ── */}
        <div
          className={`section-card reveal r2${!sessionId ? " disabled-overlay" : ""}`}
        >
          <div className="step-header">
            <span className="step-badge">2</span>
            <div className="section-title">Upload CVs</div>
          </div>
          <div className="section-sub">
            Upload PDF or DOCX files. Each CV counts toward your monthly
            screening limit.
          </div>

          <div
            className={`drop-zone${dragging ? " dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon">
              <Upload size={22} color="#7C3AED" />
            </div>
            <div className="drop-title">Drop CVs here or click to browse</div>
            <div className="drop-sub">
              PDF or DOCX · Multiple files supported
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((f) => (
                <div key={f.id} className="file-row">
                  <FileText
                    size={16}
                    color="#7C3AED"
                    style={{ flexShrink: 0 }}
                  />
                  <span className="file-name">{f.name}</span>
                  <span className="file-size">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <span className="file-status">
                    {f.status === "uploading" && (
                      <Loader2 size={14} color="#7C3AED" className="spinning" />
                    )}
                    {f.status === "done" && (
                      <CheckCircle2 size={14} color="#16a34a" />
                    )}
                    {f.status === "error" && (
                      <AlertCircle size={14} color="#ef4444" />
                      ///  title={f.error}
                    )}
                    {f.status === "pending" && (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#e2e8f0",
                        }}
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Step 3: Trigger screening ── */}
        <div
          className={`section-card reveal r3${!sessionId ? " disabled-overlay" : ""}`}
        >
          <div className="step-header">
            <span className="step-badge">3</span>
            <div className="section-title">Run AI Screening</div>
          </div>
          <div className="section-sub">
            {uploadedCount > 0
              ? `${uploadedCount} CV${uploadedCount > 1 ? "s" : ""} ready · AI will do a general professional assessment of each.`
              : "Upload CVs above then trigger AI screening."}
            {uploadingCount > 0 && ` · ${uploadingCount} still uploading...`}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={handleTriggerScreening}
              disabled={
                triggering || uploadedCount === 0 || uploadingCount > 0 || done
              }
            >
              {triggering ? (
                <>
                  <Loader2 size={14} className="spinning" /> Starting...
                </>
              ) : (
                <>
                  <Zap size={14} /> Start AI Screening
                </>
              )}
            </button>
            {uploadedCount > 0 && !triggering && (
              <button
                className="btn-outline"
                onClick={() => router.push(`/dashboard/screening/${sessionId}`)}
              >
                View Results Later →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

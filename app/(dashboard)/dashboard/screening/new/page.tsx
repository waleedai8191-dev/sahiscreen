"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../../../Style/Dashboard/Screening/new-screen.css";
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

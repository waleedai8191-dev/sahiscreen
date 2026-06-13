"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  FileText,
  Briefcase,
  Search,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronDown,
} from "lucide-react";

type Tab = "cvs" | "jobs" | "screenings";

interface CvRow {
  id: string;
  company_id: string;
  company_name: string;
  job_id: string | null;
  original_filename: string;
  candidate_name: string | null;
  candidate_email: string | null;
  file_size_kb: number | null;
  extraction_status: string | null;
  screening_status: string | null;
  created_at: string;
}

interface JobRow {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  department: string | null;
  location: string | null;
  job_type: string | null;
  status: string;
  cv_count: number;
  candidate_count: number;
  created_at: string;
}

interface ScreeningRow {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  status: string;
  cv_count: number;
  created_at: string;
}

type AnyRow = CvRow | JobRow | ScreeningRow;

const TABLE_MAP: Record<Tab, string> = {
  cvs: "cv_uploads",
  jobs: "jobs",
  screenings: "blind_screenings",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(34,197,94,.1)", color: "#16a34a" },
  open: { bg: "rgba(34,197,94,.1)", color: "#16a34a" },
  completed: { bg: "rgba(37,99,235,.1)", color: "#2563eb" },
  closed: { bg: "rgba(100,116,139,.1)", color: "#64748b" },
  pending: { bg: "rgba(245,158,11,.1)", color: "#d97706" },
  screened: { bg: "rgba(124,58,237,.1)", color: "#7c3aed" },
  draft: { bg: "rgba(245,158,11,.1)", color: "#d97706" },
};

export default function DataHistoryPage() {
  const [tab, setTab] = useState<Tab>("cvs");
  const [data, setData] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [confirmBulk, setConfirmBulk] = useState<{
    company_id: string | null;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/data-history?tab=${tab}&t=${Date.now()}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Unique companies for filter dropdown
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((r) => map.set(r.company_id, r.company_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchesCompany =
        companyFilter === "all" || r.company_id === companyFilter;
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.company_name.toLowerCase().includes(searchLower) ||
        ("original_filename" in r &&
          r.original_filename?.toLowerCase().includes(searchLower)) ||
        ("candidate_name" in r &&
          (r.candidate_name ?? "").toLowerCase().includes(searchLower)) ||
        ("title" in r && r.title?.toLowerCase().includes(searchLower)) ||
        ("name" in r && r.name?.toLowerCase().includes(searchLower));
      return matchesCompany && matchesSearch;
    });
  }, [data, search, companyFilter]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    try {
      const res = await fetch(
        `/api/admin/data-history/${TABLE_MAP[tab]}/${confirmDelete.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setData((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      setToast({ type: "success", text: "Record deleted successfully" });
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirmBulk) return;
    setActionId("bulk");
    try {
      const res = await fetch("/api/admin/data-history/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: TABLE_MAP[tab],
          company_id: confirmBulk.company_id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setToast({ type: "success", text: `${confirmBulk.label} cleared` });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setActionId(null);
      setConfirmBulk(null);
    }
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "11px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "13px 16px",
    fontSize: 13,
    color: "#374151",
    borderBottom: "1px solid #f1f5f9",
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    background: tab === t ? "#7c3aed" : "transparent",
    color: tab === t ? "#fff" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: -0.5,
            }}
          >
            Data History
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            View and delete CVs, jobs, and screenings across all companies
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 9,
            border: "1.5px solid #e2e8f0",
            background: "#fff",
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          <RefreshCw
            size={13}
            color="#7c3aed"
            style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#f1f5f9",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {(["cvs", "jobs", "screenings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
              setCompanyFilter("all");
            }}
            style={tabStyle(t)}
          >
            {t === "cvs" ? "CVs" : t === "jobs" ? "Jobs" : "Screenings"}
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 700,
                background:
                  tab === t ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)",
                borderRadius: 10,
                padding: "1px 6px",
              }}
            >
              {tab === t ? filtered.length : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder={
              tab === "cvs"
                ? "Search by filename or candidate..."
                : tab === "jobs"
                  ? "Search by job title..."
                  : "Search by screening name..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 9,
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            border: "1.5px solid #e2e8f0",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            background: "#fff",
            outline: "none",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Bulk delete controls */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {companyFilter !== "all" && (
            <button
              onClick={() =>
                setConfirmBulk({
                  company_id: companyFilter,
                  label: `All ${tab} for ${companies.find((c) => c.id === companyFilter)?.name}`,
                })
              }
              disabled={actionId === "bulk"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 9,
                border: "1.5px solid rgba(239,68,68,.2)",
                background: "rgba(239,68,68,.05)",
                fontSize: 12,
                fontWeight: 700,
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Trash2 size={13} /> Clear Company {tab}
            </button>
          )}
          <button
            onClick={() =>
              setConfirmBulk({
                company_id: null,
                label: `All ${tab} across every company`,
              })
            }
            disabled={actionId === "bulk"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1.5px solid rgba(239,68,68,.3)",
              background: "rgba(239,68,68,.08)",
              fontSize: 12,
              fontWeight: 700,
              color: "#dc2626",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Trash2 size={13} /> Clear All {tab}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: toast.type === "success" ? "#16a34a" : "#ef4444",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,.15)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertTriangle size={15} />
          )}
          {toast.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={26} className="animate-spin" color="#7c3aed" />
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {tab === "cvs" && (
                    <>
                      <th style={thStyle}>Candidate</th>
                      <th style={thStyle}>File</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Uploaded</th>
                      <th style={thStyle}></th>
                    </>
                  )}
                  {tab === "jobs" && (
                    <>
                      <th style={thStyle}>Job Title</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Department</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>CVs</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}></th>
                    </>
                  )}
                  {tab === "screenings" && (
                    <>
                      <th style={thStyle}>Screening Name</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>CVs</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const busy = actionId === row.id;
                  if (tab === "cvs") {
                    const r = row as CvRow;
                    const statusStyle =
                      STATUS_COLORS[r.screening_status ?? ""] ??
                      STATUS_COLORS.pending;
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {r.candidate_name ?? "—"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            {r.candidate_email ?? "—"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "#374151",
                            }}
                          >
                            {r.original_filename}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            {r.file_size_kb ? `${r.file_size_kb} KB` : "—"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 20,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              textTransform: "capitalize",
                            }}
                          >
                            {r.screening_status ?? "pending"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: "#64748b" }}>
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                id: r.id,
                                label: r.original_filename,
                              })
                            }
                            disabled={busy}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: "1.5px solid rgba(239,68,68,.2)",
                              background: "rgba(239,68,68,.05)",
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#ef4444",
                              cursor: busy ? "not-allowed" : "pointer",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {busy ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (tab === "jobs") {
                    const r = row as JobRow;
                    const statusStyle =
                      STATUS_COLORS[r.status] ?? STATUS_COLORS.draft;
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {r.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            {r.location ?? "—"}{" "}
                            {r.job_type ? `· ${r.job_type}` : ""}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: "#64748b" }}>
                          {r.department ?? "—"}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 20,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              textTransform: "capitalize",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {r.cv_count ?? 0}
                        </td>
                        <td style={{ ...tdStyle, color: "#64748b" }}>
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setConfirmDelete({ id: r.id, label: r.title })
                            }
                            disabled={busy}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: "1.5px solid rgba(239,68,68,.2)",
                              background: "rgba(239,68,68,.05)",
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#ef4444",
                              cursor: busy ? "not-allowed" : "pointer",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {busy ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (tab === "screenings") {
                    const r = row as ScreeningRow;
                    const statusStyle =
                      STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;
                    return (
                      <tr key={r.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {r.name}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 20,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              textTransform: "capitalize",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {r.cv_count ?? 0}
                        </td>
                        <td style={{ ...tdStyle, color: "#64748b" }}>
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setConfirmDelete({ id: r.id, label: r.name })
                            }
                            disabled={busy}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "5px 10px",
                              borderRadius: 7,
                              border: "1.5px solid rgba(239,68,68,.2)",
                              background: "rgba(239,68,68,.05)",
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#ef4444",
                              cursor: busy ? "not-allowed" : "pointer",
                              opacity: busy ? 0.6 : 1,
                            }}
                          >
                            {busy ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && !loading && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No records found
            </div>
          )}
        </div>
      )}

      {/* Single delete confirm modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: "90%",
              maxWidth: 380,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(239,68,68,.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={17} color="#ef4444" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Delete Record?
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              This will permanently delete{" "}
              <strong>{confirmDelete.label}</strong>. This cannot be undone.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "none",
                  background: "#ef4444",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm modal */}
      {confirmBulk && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setConfirmBulk(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(239,68,68,.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={17} color="#ef4444" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                Bulk Delete?
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              This will permanently delete <strong>{confirmBulk.label}</strong>.
              This cannot be undone.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setConfirmBulk(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={actionId === "bulk"}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "none",
                  background: "#ef4444",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: actionId === "bulk" ? "not-allowed" : "pointer",
                  opacity: actionId === "bulk" ? 0.7 : 1,
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {actionId === "bulk" && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

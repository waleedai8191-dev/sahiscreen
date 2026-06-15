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
import "../../Style/Admin/data-history.css";
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

  return (
    <div className="dh-page">
      {/* Header */}
      <div className="dh-header">
        <div>
          <h1 className="dh-title">Data History</h1>
          <p className="dh-subtitle">
            View and delete CVs, jobs, and screenings across all companies
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className={`dh-refresh-btn${loading ? " dh-btn-disabled" : ""}`}
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
      <div className="dh-tab-bar">
        {(["cvs", "jobs", "screenings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
              setCompanyFilter("all");
            }}
            className={`dh-tab-btn${tab === t ? " dh-tab-active" : ""}`}
          >
            {t === "cvs" ? "CVs" : t === "jobs" ? "Jobs" : "Screenings"}
            <span
              className={`dh-tab-count${tab === t ? " dh-tab-count-active" : ""}`}
            >
              {tab === t ? filtered.length : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="dh-filters-row">
        <div className="dh-search-wrap">
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
            className="dh-search-input"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="dh-company-select"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {/* Bulk delete controls */}
        <div className="dh-bulk-controls">
          {companyFilter !== "all" && (
            <button
              onClick={() =>
                setConfirmBulk({
                  company_id: companyFilter,
                  label: `All ${tab} for ${companies.find((c) => c.id === companyFilter)?.name}`,
                })
              }
              disabled={actionId === "bulk"}
              className="dh-danger-btn dh-danger-btn-light"
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
            className="dh-danger-btn dh-danger-btn-strong"
          >
            <Trash2 size={13} /> Clear All {tab}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`dh-toast dh-toast-${toast.type}`}>
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
        <div className="dh-loading">
          <Loader2 size={26} className="animate-spin" color="#7c3aed" />
        </div>
      ) : (
        <div className="dh-table-card">
          <div className="dh-table-scroll">
            <table className="dh-table">
              <thead>
                <tr className="dh-thead-row">
                  {tab === "cvs" && (
                    <>
                      <th className="dh-th">Candidate</th>
                      <th className="dh-th">File</th>
                      <th className="dh-th">Company</th>
                      <th className="dh-th">Status</th>
                      <th className="dh-th">Uploaded</th>
                      <th className="dh-th"></th>
                    </>
                  )}
                  {tab === "jobs" && (
                    <>
                      <th className="dh-th">Job Title</th>
                      <th className="dh-th">Company</th>
                      <th className="dh-th">Department</th>
                      <th className="dh-th">Status</th>
                      <th className="dh-th">CVs</th>
                      <th className="dh-th">Created</th>
                      <th className="dh-th"></th>
                    </>
                  )}
                  {tab === "screenings" && (
                    <>
                      <th className="dh-th">Screening Name</th>
                      <th className="dh-th">Company</th>
                      <th className="dh-th">Status</th>
                      <th className="dh-th">CVs</th>
                      <th className="dh-th">Created</th>
                      <th className="dh-th"></th>
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
                        <td className="dh-td">
                          <div className="dh-cell-title">
                            {r.candidate_name ?? "—"}
                          </div>
                          <div className="dh-cell-sub">
                            {r.candidate_email ?? "—"}
                          </div>
                        </td>
                        <td className="dh-td">
                          <div className="dh-cell-filename">
                            {r.original_filename}
                          </div>
                          <div className="dh-cell-sub">
                            {r.file_size_kb ? `${r.file_size_kb} KB` : "—"}
                          </div>
                        </td>
                        <td className="dh-td">
                          <div className="dh-cell-company">
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td className="dh-td">
                          <span
                            className="dh-badge"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {r.screening_status ?? "pending"}
                          </span>
                        </td>
                        <td className="dh-td dh-td-muted">
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="dh-td">
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                id: r.id,
                                label: r.original_filename,
                              })
                            }
                            disabled={busy}
                            className={`dh-delete-btn${busy ? " dh-btn-disabled" : ""}`}
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
                        <td className="dh-td">
                          <div className="dh-cell-title">{r.title}</div>
                          <div className="dh-cell-sub">
                            {r.location ?? "—"}{" "}
                            {r.job_type ? `· ${r.job_type}` : ""}
                          </div>
                        </td>
                        <td className="dh-td">
                          <div className="dh-cell-company">
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td className="dh-td dh-td-muted">
                          {r.department ?? "—"}
                        </td>
                        <td className="dh-td">
                          <span
                            className="dh-badge"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="dh-td dh-td-bold">{r.cv_count ?? 0}</td>
                        <td className="dh-td dh-td-muted">
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="dh-td">
                          <button
                            onClick={() =>
                              setConfirmDelete({ id: r.id, label: r.title })
                            }
                            disabled={busy}
                            className={`dh-delete-btn${busy ? " dh-btn-disabled" : ""}`}
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
                        <td className="dh-td">
                          <div className="dh-cell-title">{r.name}</div>
                        </td>
                        <td className="dh-td">
                          <div className="dh-cell-company">
                            <Building2 size={12} color="#94a3b8" />
                            {r.company_name}
                          </div>
                        </td>
                        <td className="dh-td">
                          <span
                            className="dh-badge"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="dh-td dh-td-bold">{r.cv_count ?? 0}</td>
                        <td className="dh-td dh-td-muted">
                          {new Date(r.created_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="dh-td">
                          <button
                            onClick={() =>
                              setConfirmDelete({ id: r.id, label: r.name })
                            }
                            disabled={busy}
                            className={`dh-delete-btn${busy ? " dh-btn-disabled" : ""}`}
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
            <div className="dh-empty">No records found</div>
          )}
        </div>
      )}

      {/* Single delete confirm modal */}
      {confirmDelete && (
        <div
          className="dh-modal-backdrop"
          onClick={() => setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="dh-modal-box">
            <div className="dh-modal-header">
              <div className="dh-modal-icon">
                <AlertTriangle size={17} color="#ef4444" />
              </div>
              <div className="dh-modal-title">Delete Record?</div>
            </div>
            <p className="dh-modal-body">
              This will permanently delete{" "}
              <strong>{confirmDelete.label}</strong>. This cannot be undone.
            </p>
            <div className="dh-modal-actions">
              <button
                onClick={() => setConfirmDelete(null)}
                className="dh-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionId === confirmDelete?.id}
                className="dh-modal-confirm"
              >
                {actionId === confirmDelete?.id && (
                  <Loader2 size={13} className="animate-spin" />
                )}
                {actionId === confirmDelete?.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm modal */}
      {confirmBulk && (
        <div className="dh-modal-backdrop" onClick={() => setConfirmBulk(null)}>
          <div onClick={(e) => e.stopPropagation()} className="dh-modal-box">
            <div className="dh-modal-header">
              <div className="dh-modal-icon">
                <AlertTriangle size={17} color="#ef4444" />
              </div>
              <div className="dh-modal-title">Bulk Delete?</div>
            </div>
            <p className="dh-modal-body">
              This will permanently delete <strong>{confirmBulk.label}</strong>.
              This cannot be undone.
            </p>
            <div className="dh-modal-actions">
              <button
                onClick={() => setConfirmBulk(null)}
                className="dh-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={actionId === "bulk"}
                className="dh-modal-confirm"
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

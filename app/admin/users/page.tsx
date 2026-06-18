"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Loader2,
  Trash2,
  Building2,
  CheckCircle2,
  ShieldOff,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  designation: string | null;
  is_active: boolean;
  company_id: string | null;
  company_name: string;
  created_at: string;
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(124,58,237,.1)", color: "#7c3aed" },
  hr: { bg: "rgba(37,99,235,.1)", color: "#2563eb" },
  viewer: { bg: "rgba(100,116,139,.1)", color: "#64748b" },
  superadmin: { bg: "rgba(239,68,68,.1)", color: "#ef4444" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        u.company_name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const toggleActive = async (u: AdminUser) => {
    setActionId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_active: json.user.is_active } : x,
        ),
      );
      setToast({
        type: "success",
        text: `${u.email} ${json.user.is_active ? "activated" : "deactivated"}`,
      });
    } catch (err: any) {
      fetchUsers();
      setToast({ type: "error", text: err.message });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setUsers((prev) => prev.filter((x) => x.id !== confirmDelete.id));
      setToast({ type: "success", text: `${confirmDelete.email} deleted` });
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <style>{`
        .users-table-wrap { display: block; }
        .users-cards-wrap { display: none; }

        @media (max-width: 768px) {
          .users-table-wrap { display: none; }
          .users-cards-wrap { display: flex; flex-direction: column; gap: 12px; }
        }

        .user-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
        }

        .user-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .user-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .user-card-actions {
          display: flex;
          gap: 8px;
        }

        .user-card-actions button {
          flex: 1;
          justify-content: center;
        }
      `}</style>

      <div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 12,
            flexWrap: "wrap",
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
              HR Users
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {users.length} total users across all companies
            </p>
          </div>
          <button
            onClick={fetchUsers}
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
            <RefreshCw size={13} color="#7c3aed" />
            Refresh
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: 20,
              right: 16,
              left: 16,
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
              maxWidth: 420,
              margin: "0 auto",
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

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 200px" }}>
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
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 9,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "9px 14px",
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
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="viewer">Viewer</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 60 }}
          >
            <Loader2 size={28} className="animate-spin" color="#7c3aed" />
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE ── */}
            <div
              className="users-table-wrap"
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
                      {["User", "Company", "Role", "Joined", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "12px 16px",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const roleStyle =
                        ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer;
                      const busy = actionId === u.id;
                      return (
                        <tr
                          key={u.id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {u.full_name ?? "—"}
                            </div>
                            <div
                              style={{
                                fontSize: 11.5,
                                color: "#94a3b8",
                                marginTop: 2,
                              }}
                            >
                              {u.email}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                color: "#374151",
                                fontWeight: 600,
                              }}
                            >
                              <Building2 size={13} color="#94a3b8" />
                              {u.company_name}
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: roleStyle.bg,
                                color: roleStyle.color,
                                textTransform: "capitalize",
                              }}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "14px 16px",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(u.created_at).toLocaleDateString(
                              "en-PK",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {u.role === "superadmin" ? (
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: "#94a3b8",
                                  fontStyle: "italic",
                                }}
                              >
                                Protected
                              </span>
                            ) : (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() => toggleActive(u)}
                                  disabled={busy}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "5px 10px",
                                    borderRadius: 7,
                                    border: "1.5px solid #e2e8f0",
                                    background: "#fff",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: u.is_active ? "#d97706" : "#16a34a",
                                    cursor: busy ? "not-allowed" : "pointer",
                                    opacity: busy ? 0.6 : 1,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {busy ? (
                                    <Loader2
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : u.is_active ? (
                                    <ShieldOff size={12} />
                                  ) : (
                                    <CheckCircle2 size={12} />
                                  )}
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(u)}
                                  disabled={busy}
                                  style={{
                                    display: "flex",
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
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  No users found
                </div>
              )}
            </div>

            {/* ── MOBILE CARDS ── */}
            <div className="users-cards-wrap">
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  No users found
                </div>
              )}
              {filtered.map((u) => {
                const roleStyle = ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer;
                const busy = actionId === u.id;
                return (
                  <div key={u.id} className="user-card">
                    {/* Card header — name + status badge */}
                    <div className="user-card-header">
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: 14,
                          }}
                        >
                          {u.full_name ?? "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 2,
                          }}
                        >
                          {u.email}
                        </div>
                      </div>
                    </div>

                    {/* Meta row — company, role, joined */}
                    <div className="user-card-meta">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      >
                        <Building2 size={12} color="#94a3b8" />
                        {u.company_name}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 20,
                          background: roleStyle.bg,
                          color: roleStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {u.role}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Joined{" "}
                        {new Date(u.created_at).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    {u.role === "superadmin" ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontStyle: "italic",
                        }}
                      >
                        Protected account
                      </div>
                    ) : (
                      <div className="user-card-actions">
                        <button
                          onClick={() => toggleActive(u)}
                          disabled={busy}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1.5px solid #e2e8f0",
                            background: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                            color: u.is_active ? "#d97706" : "#16a34a",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.6 : 1,
                            fontFamily: "inherit",
                          }}
                        >
                          {busy ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : u.is_active ? (
                            <ShieldOff size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={busy}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1.5px solid rgba(239,68,68,.2)",
                            background: "rgba(239,68,68,.05)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#ef4444",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.6 : 1,
                            fontFamily: "inherit",
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 16,
            }}
            onClick={() => setConfirmDelete(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 24,
                width: "100%",
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
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={17} color="#ef4444" />
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}
                >
                  Delete User?
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
                <strong>{confirmDelete.email}</strong> and their entire company.
                This cannot be undone.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
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
                  disabled={actionId === confirmDelete.id}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 9,
                    border: "none",
                    background: "#ef4444",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    cursor:
                      actionId === confirmDelete.id ? "not-allowed" : "pointer",
                    opacity: actionId === confirmDelete.id ? 0.7 : 1,
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {actionId === confirmDelete.id && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, Users, ExternalLink } from "lucide-react";

interface Company {
  id: string;
  name: string;
  size: string | null;
  industry: string | null;
  website: string | null;
  created_at: string;
  user_count: number;
  plan_tier: string;
  status: string;
  payment_status: string | null;
  cv_count_current: number;
  cv_limit_monthly: number;
  job_limit: number;
  current_period_end: string | null;
}

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: "rgba(100,116,139,.1)", color: "#64748b" },
  essential: { bg: "rgba(37,99,235,.1)", color: "#2563eb" },
  premium: { bg: "rgba(124,58,237,.1)", color: "#7c3aed" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(34,197,94,.1)", color: "#16a34a" },
  pending_payment: { bg: "rgba(245,158,11,.1)", color: "#d97706" },
  cancelled: { bg: "rgba(239,68,68,.1)", color: "#ef4444" },
  trial: { bg: "rgba(37,99,235,.1)", color: "#2563eb" },
};

export default function AdminCompaniesPage() {
  const pathname = usePathname();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/companies?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [pathname, fetchCompanies]);
  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || c.plan_tier === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [companies, search, planFilter]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={28} className="animate-spin" color="#7c3aed" />
      </div>
    );
  }

  return (
    <div>
      <>
        <style>{`
        .co-table-wrap { display: block; }
        .co-cards-wrap { display: none; }

        @media (max-width: 768px) {
          .co-table-wrap { display: none; }
          .co-cards-wrap { display: flex; flex-direction: column; gap: 12px; }
        }

        .co-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .co-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .co-card-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .co-card-usage { margin-bottom: 14px; }
        .co-card-footer { display: flex; align-items: center; justify-content: space-between; }

        .plan-badge  { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: capitalize; }
        .plan-free      { background: rgba(100,116,139,.1); color: #64748b; }
        .plan-essential { background: rgba(37,99,235,.1);   color: #2563eb; }
        .plan-premium   { background: rgba(124,58,237,.1);  color: #7c3aed; }

        .status-badge           { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: capitalize; }
        .status-active          { background: rgba(34,197,94,.1);  color: #16a34a; }
        .status-pending_payment { background: rgba(245,158,11,.1); color: #d97706; }
        .status-cancelled       { background: rgba(239,68,68,.1);  color: #ef4444; }
        .status-trial           { background: rgba(37,99,235,.1);  color: #2563eb; }
      `}</style>
      </>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
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
            Companies
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {companies.length} total companies registered
          </p>
        </div>
        <button
          onClick={fetchCompanies}
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
          <Loader2
            size={14}
            className={loading ? "animate-spin" : ""}
            color="#7c3aed"
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 9,
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
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
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="essential">Essential</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Table */}
      {/* Table */}
      <div
        className="co-table-wrap"
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {[
                  "Company",
                  "Plan",
                  "Status",
                  "CV Usage",
                  "Users",
                  "Joined",
                  "",
                ].map((h) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const planStyle = PLAN_COLORS[c.plan_tier] ?? PLAN_COLORS.free;
                const statusStyle =
                  STATUS_COLORS[c.status] ?? STATUS_COLORS.active;
                const usagePct = c.cv_limit_monthly
                  ? Math.min(
                      100,
                      Math.round(
                        (c.cv_count_current / c.cv_limit_monthly) * 100,
                      ),
                    )
                  : 0;

                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                      >
                        {c.industry ?? "—"} {c.size ? `· ${c.size}` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`plan-badge plan-${c.plan_tier}`}>
                        {c.plan_tier}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`status-badge status-${c.status}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", minWidth: 140 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 4,
                        }}
                      >
                        {c.cv_count_current} / {c.cv_limit_monthly || "∞"}
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "#f1f5f9",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${usagePct}%`,
                            background: usagePct > 90 ? "#ef4444" : "#7c3aed",
                            borderRadius: 4,
                          }}
                        />
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
                        <Users size={13} color="#94a3b8" />
                        {c.user_count}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b" }}>
                      {new Date(c.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Link
                        href={`/admin/companies/${c.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#7c3aed",
                          textDecoration: "none",
                        }}
                      >
                        View <ExternalLink size={12} />
                      </Link>
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
            No companies found
          </div>
        )}
      </div>
      {/* ── MOBILE CARDS ── */}
      <div className="co-cards-wrap">
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
            No companies found
          </div>
        )}
        {filtered.map((c) => {
          const usagePct = c.cv_limit_monthly
            ? Math.min(
                100,
                Math.round((c.cv_count_current / c.cv_limit_monthly) * 100),
              )
            : 0;
          return (
            <div key={c.id} className="co-card">
              {/* Name + status */}
              <div className="co-card-header">
                <div>
                  <div
                    style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {c.industry ?? "—"}
                    {c.size ? ` · ${c.size}` : ""}
                  </div>
                </div>
                <span className={`status-badge status-${c.status}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>

              {/* Plan + user count */}
              <div className="co-card-meta">
                <span className={`plan-badge plan-${c.plan_tier}`}>
                  {c.plan_tier}
                </span>
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
                  <Users size={12} color="#94a3b8" /> {c.user_count} users
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Joined{" "}
                  {new Date(c.created_at).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* CV usage bar */}
              <div className="co-card-usage">
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  CV Usage: {c.cv_count_current} / {c.cv_limit_monthly || "∞"}
                </div>
                <div
                  style={{
                    height: 5,
                    background: "#f1f5f9",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${usagePct}%`,
                      background: usagePct > 90 ? "#ef4444" : "#7c3aed",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Footer — view link */}
              <div className="co-card-footer">
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {usagePct}% used
                </span>
                <Link
                  href={`/admin/companies/${c.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7c3aed",
                    textDecoration: "none",
                  }}
                >
                  View <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

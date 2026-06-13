"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../../../Style/Companies/companies.css";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  FileText,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
  Import,
} from "lucide-react";
import { PLANS, type PlanTier } from "@/lib/plans";
import { fromTheme } from "tailwind-merge";

interface CompanyData {
  company: {
    id: string;
    name: string;
    size: string | null;
    industry: string | null;
    website: string | null;
    created_at: string;
  };
  subscription: {
    plan_tier: string;
    status: string;
    cv_count_current: number;
    cv_limit_monthly: number;
    job_limit: number;
    current_period_end: string | null;
    payment_status: string | null;
  } | null;
  users: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    designation: string | null;
    is_active: boolean;
    created_at: string;
  }[];
  totalCvs: number;
  jobCount: number;
}

const STATUS_OPTIONS = ["active", "trial", "pending_payment", "cancelled"];

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [planTier, setPlanTier] = useState<PlanTier>("free");
  const [status, setStatus] = useState("active");
  const [cvLimit, setCvLimit] = useState(0);
  const [cvUsed, setCvUsed] = useState(0);
  const [jobLimit, setJobLimit] = useState(0);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/companies/${id}`);
    const json = await res.json();
    if (res.ok) {
      setData(json);
      const sub = json.subscription;
      setPlanTier((sub?.plan_tier ?? "free") as PlanTier);
      setStatus(sub?.status ?? "active");
      setCvLimit(sub?.cv_limit_monthly ?? PLANS.free.cvLimit);
      setCvUsed(sub?.cv_count_current ?? 0);
      setJobLimit(sub?.job_limit ?? PLANS.free.jobLimit);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlanChange = (tier: PlanTier) => {
    setPlanTier(tier);
    // Auto-fill limits with the new plan's defaults — admin can still override below
    setCvLimit(PLANS[tier].cvLimit);
    setJobLimit(PLANS[tier].jobLimit);
  };

  const handleSave = async () => {
    setSaveMsg(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_tier: planTier,
          status,
          cv_limit_monthly: cvLimit,
          cv_count_current: cvUsed,
          job_limit: jobLimit,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      setSaveMsg({
        type: "success",
        text: "Subscription updated successfully",
      });
      setSaveMsg({
        type: "success",
        text: "Subscription updated successfully",
      });
      setTimeout(() => setSaveMsg(null), 3000);
      fetchData();
    } catch (err: any) {
      setSaveMsg({
        type: "error",
        text: err.message ?? "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={28} className="animate-spin" color="#7c3aed" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        Company not found
      </div>
    );
  }

  const { company, users, totalCvs, jobCount } = data;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 9,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    color: "#0f172a",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/companies"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: "#64748b",
          textDecoration: "none",
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={14} /> Back to Companies
      </Link>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(124,58,237,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Building2 size={22} color="#7c3aed" />
        </div>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: -0.5,
            }}
          >
            {company.name}
          </h1>
          <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
            {company.industry ?? "—"} {company.size ? `· ${company.size}` : ""}{" "}
            · Joined{" "}
            {new Date(company.created_at).toLocaleDateString("en-PK", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total CVs",
            value: totalCvs,
            icon: FileText,
            color: "#d97706",
          },
          {
            label: "Active Jobs",
            value: jobCount,
            icon: Briefcase,
            color: "#2563eb",
          },
          {
            label: "Team Members",
            value: users.length,
            icon: Users,
            color: "#16a34a",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: `${s.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={16} color={s.color} />
              </div>
              <div>
                <div
                  style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}
                >
                  {s.value}
                </div>
                <div
                  style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription editor */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          Subscription Management
        </div>
        <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 20 }}>
          Changes here update the company's plan in real time. If they're logged
          in, their billing page reflects this immediately.
        </p>

        {saveMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 9,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 600,
              background:
                saveMsg.type === "success"
                  ? "rgba(34,197,94,.08)"
                  : "rgba(239,68,68,.08)",
              color: saveMsg.type === "success" ? "#16a34a" : "#ef4444",
            }}
          >
            {saveMsg.type === "success" ? (
              <CheckCircle2 size={15} />
            ) : (
              <AlertCircle size={15} />
            )}
            {saveMsg.text}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Plan tier */}
          <div>
            <label style={labelStyle}>Plan Tier</label>
            <select
              value={planTier}
              onChange={(e) => handlePlanChange(e.target.value as PlanTier)}
              style={{ ...inputStyle, cursor: "pointer", fontWeight: 600 }}
            >
              <option value="free">Free</option>
              <option value="essential">Essential</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Subscription Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                ...inputStyle,
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option
                  key={s}
                  value={s}
                  style={{ textTransform: "capitalize" }}
                >
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 8,
          }}
        >
          {/* CV Limit */}
          <div>
            <label style={labelStyle}>Monthly CV Limit</label>
            <input
              type="number"
              value={cvLimit}
              onChange={(e) => setCvLimit(Number(e.target.value))}
              style={inputStyle}
              min={0}
            />
          </div>

          {/* CV Used */}
          <div>
            <label style={labelStyle}>CVs Used (current period)</label>
            <input
              type="number"
              value={cvUsed}
              onChange={(e) => setCvUsed(Number(e.target.value))}
              style={inputStyle}
              min={0}
            />
          </div>

          {/* Job Limit */}
          <div>
            <label style={labelStyle}>Active Job Limit</label>
            <input
              type="number"
              value={jobLimit}
              onChange={(e) => setJobLimit(Number(e.target.value))}
              style={inputStyle}
              min={0}
            />
          </div>
        </div>

        <p style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 20 }}>
          Tip: Changing plan tier auto-fills limits with that plan's defaults —
          you can still override them above before saving.
        </p>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Team members */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          Team Members ({users.length})
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 20px",
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
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td
                    style={{
                      padding: "12px 20px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {u.full_name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 20px", color: "#64748b" }}>
                    {u.email}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      color: "#374151",
                      textTransform: "capitalize",
                    }}
                  >
                    {u.role}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 9px",
                        borderRadius: 20,
                        background: u.is_active
                          ? "rgba(34,197,94,.1)"
                          : "rgba(239,68,68,.1)",
                        color: u.is_active ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", color: "#64748b" }}>
                    {new Date(u.created_at).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            No team members yet
          </div>
        )}
      </div>
    </div>
  );
}

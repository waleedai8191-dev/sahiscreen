"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Users,
  FileText,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface Stats {
  totalCompanies: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  planBreakdown: { free: number; essential: number; premium: number };
  cvsToday: number;
  totalCvs: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/admin/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .finally(() => setLoading(false));
    };
    fetchStats();

    // Re-fetch every 30 seconds to stay fresh
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Loader2 size={28} className="animate-spin" color="#7c3aed" />
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load stats.</div>;
  }

  const cards = [
    {
      label: "Total Companies",
      value: stats.totalCompanies,
      icon: Building2,
      color: "#7c3aed",
      bg: "rgba(124,58,237,.08)",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "#2563eb",
      bg: "rgba(37,99,235,.08)",
    },
    {
      label: "Monthly Revenue",
      value: `PKR ${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "#16a34a",
      bg: "rgba(34,197,94,.08)",
    },
    {
      label: "CVs Screened Today",
      value: stats.cvsToday,
      icon: FileText,
      color: "#d97706",
      bg: "rgba(245,158,11,.08)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: -0.5,
          }}
        >
          Overview
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Platform-wide stats across all companies
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: c.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Icon size={18} color={c.color} />
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "#64748b",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan breakdown */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 16,
          }}
        >
          Plan Distribution
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              label: "Free",
              value: stats.planBreakdown.free,
              color: "#64748b",
            },
            {
              label: "Essential",
              value: stats.planBreakdown.essential,
              color: "#2563eb",
            },
            {
              label: "Premium",
              value: stats.planBreakdown.premium,
              color: "#7c3aed",
            },
          ].map((p) => (
            <div
              key={p.label}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: p.color,
                }}
              />
              <div>
                <div
                  style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}
                >
                  {p.value}
                </div>
                <div
                  style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}
                >
                  {p.label} Companies
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  LogOut,
  HelpCircle,
} from "lucide-react";

import type { UserProfile, SubscriptionStatus } from "@/lib/supabase/types";

// ── Nav items ─────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
    roles: ["admin", "hr", "viewer"],
  },
  {
    label: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    exact: false,
    roles: ["admin", "hr", "viewer"],
  },
  {
    label: "Candidates",
    href: "/dashboard/candidates",
    icon: Users,
    exact: false,
    roles: ["admin", "hr", "viewer"],
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    exact: false,
    roles: ["admin"], // hidden for hr/viewer
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    exact: false,
    roles: ["admin", "hr"], // hidden for viewer
  },
];

const BOTTOM_ITEMS = [
  {
    label: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    roles: ["admin", "hr", "viewer"],
  },
];

// ── Props ─────────────────────────────────────────────────

interface SidebarProps {
  profile: UserProfile | null;
  subscription: SubscriptionStatus | null;
}

// ── Plan badge config ─────────────────────────────────────

const PLAN_CONFIG = {
  trial: { label: "Free Trial", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  essential: {
    label: "Essential",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
  },
  premium: { label: "Premium", color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  expired: { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.15)",
  },
} as const;

// ── Component ─────────────────────────────────────────────

export default function Sidebar({ profile, subscription }: SidebarProps) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    // await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const userRole = (profile?.role ?? "viewer") as "admin" | "hr" | "viewer";
  const plan = subscription?.plan ?? "trial";
  const planCfg =
    PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.trial;

  const cvUsed = subscription?.cvs_used_this_month ?? 0;
  const cvLimit = subscription?.cv_limit ?? 50;
  const cvPct = Math.min(100, Math.round((cvUsed / cvLimit) * 100));

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .sidebar {
          width: 100%;
          height: 100%;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
          position: relative;
          transition: all 0.25s ease;
        }

        /* Subtle top glow */
        .sidebar-glow {
          position: absolute;
          top: -60px; left: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        /* ── Logo row ── */
        .sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 18px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .sidebar-logo-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          overflow: hidden;
        }

        .sidebar-logo-icon {
          width: 34px; height: 34px;
          background: #7C3AED;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(124,58,237,0.4);
        }

        .sidebar-logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          white-space: nowrap;
          transition: opacity 0.2s, width 0.25s;
        }

        .sidebar.collapsed .sidebar-logo-text {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        .collapse-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .collapse-btn:hover {
          background: rgba(124,58,237,0.2);
          border-color: rgba(124,58,237,0.3);
          color: #a78bfa;
        }

        .sidebar.collapsed .collapse-btn {
          margin: 0 auto;
        }

        /* ── Plan badge ── */
        .sidebar-plan {
          margin: 14px 14px 4px;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          overflow: hidden;
          transition: all 0.25s;
          flex-shrink: 0;
        }

        .sidebar.collapsed .sidebar-plan {
          justify-content: center;
          padding: 10px 0;
          margin: 14px 10px 4px;
        }

        .plan-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .plan-info {
          flex: 1;
          min-width: 0;
          transition: opacity 0.2s;
        }

        .sidebar.collapsed .plan-info {
          display: none;
        }

        .plan-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          display: block;
          white-space: nowrap;
        }

        .plan-sub {
          font-size: 10px;
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Nav section ── */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 10px;
          scrollbar-width: none;
        }

        .sidebar-nav::-webkit-scrollbar { display: none; }

        .nav-section-label {
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 10px 10px 6px;
          white-space: nowrap;
          transition: opacity 0.2s;
        }

        .sidebar.collapsed .nav-section-label {
          opacity: 0;
          height: 0;
          padding: 0;
          overflow: hidden;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.18s ease;
          margin-bottom: 2px;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 10px 0;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
        }

        .nav-item.active {
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.25);
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: #7C3AED;
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          transition: color 0.18s;
        }

        .nav-item .nav-icon { color: #475569; }
        .nav-item:hover .nav-icon { color: #94a3b8; }
        .nav-item.active .nav-icon { color: #a78bfa; }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: color 0.18s, opacity 0.2s, width 0.25s;
          overflow: hidden;
        }

        .nav-item:hover .nav-label { color: #cbd5e1; }
        .nav-item.active .nav-label { color: #e2e8f0; font-weight: 600; }

        .sidebar.collapsed .nav-label {
          opacity: 0;
          width: 0;
        }

        /* Tooltip on collapsed */
        .nav-item[data-tooltip] {
          position: relative;
        }

        .sidebar.collapsed .nav-item:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          color: #e2e8f0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 100;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        /* ── CV usage bar ── */
        .sidebar-usage {
          margin: 4px 14px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px;
          flex-shrink: 0;
          overflow: hidden;
          transition: all 0.25s;
        }

        .sidebar.collapsed .sidebar-usage {
          display: none;
        }

        .usage-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .usage-label {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .usage-count {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
        }

        .usage-track {
          height: 5px;
          background: rgba(255,255,255,0.06);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .usage-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .usage-sub {
          font-size: 10px;
          color: #334155;
          font-weight: 500;
        }

        /* ── Divider ── */
        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 4px 14px;
          flex-shrink: 0;
        }

        /* ── Bottom nav ── */
        .sidebar-bottom {
          padding: 8px 10px 4px;
          flex-shrink: 0;
        }

        /* ── User row ── */
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 12px;
          margin: 4px 10px 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
          transition: all 0.25s;
          flex-shrink: 0;
        }

        .sidebar.collapsed .sidebar-user {
          justify-content: center;
          padding: 10px 0;
          margin: 4px 10px 10px;
        }

        .user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
          transition: opacity 0.2s;
        }

        .sidebar.collapsed .user-info {
          display: none;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .user-role {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
          text-transform: capitalize;
        }

        .signout-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #334155;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .signout-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }

        .sidebar.collapsed .signout-btn {
          display: none;
        }

        /* Upgrade CTA */
        .sidebar-upgrade {
          margin: 4px 14px 10px;
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.08));
          border: 1px solid rgba(124,58,237,0.25);
          border-radius: 10px;
          padding: 12px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar.collapsed .sidebar-upgrade {
          display: none;
        }

        .sidebar-upgrade:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.15));
          border-color: rgba(124,58,237,0.4);
          transform: translateY(-1px);
        }

        .upgrade-icon {
          width: 30px; height: 30px;
          background: #7C3AED;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .upgrade-text {}

        .upgrade-title {
          font-size: 12px;
          font-weight: 700;
          color: #a78bfa;
          display: block;
          margin-bottom: 1px;
        }

        .upgrade-sub {
          font-size: 10px;
          color: #475569;
          font-weight: 500;
        }
      `}</style>

      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-glow" />

        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <Link href="/dashboard" className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <span className="sidebar-logo-text">SahiScreen</span>
          </Link>
          <button
            className="collapse-btn"
            onClick={toggleCollapse}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* ── Plan badge ── */}
        <div className="sidebar-plan">
          <span className="plan-dot" style={{ background: planCfg.color }} />
          <div className="plan-info">
            <span className="plan-label" style={{ color: planCfg.color }}>
              {planCfg.label}
            </span>
            <span className="plan-sub">
              {/* {profile?.company_name ?? "Your Company"} */}
            </span>
          </div>
        </div>

        {/* ── Main Nav ── */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>

          {NAV_ITEMS.filter((item) => item.roles.includes(userRole)).map(
            (item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  data-tooltip={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            },
          )}
        </nav>

        {/* ── CV Usage meter ── */}
        {subscription && (
          <div className="sidebar-usage">
            <div className="usage-row">
              <span className="usage-label">
                <BarChart3 size={11} />
                CV Usage
              </span>
              <span className="usage-count">
                {cvUsed}/{cvLimit}
              </span>
            </div>
            <div className="usage-track">
              <div
                className="usage-fill"
                style={{
                  width: `${cvPct}%`,
                  background:
                    cvPct >= 90
                      ? "#ef4444"
                      : cvPct >= 75
                        ? "#f59e0b"
                        : "#7C3AED",
                }}
              />
            </div>
            <span className="usage-sub">{cvPct}% used this month</span>
          </div>
        )}

        {/* Upgrade CTA — show for trial/essential users */}
        {(plan === "trial" || plan === "essential") && userRole === "admin" && (
          <Link href="/dashboard/billing" className="sidebar-upgrade">
            <div className="upgrade-icon">
              <Zap size={14} color="white" />
            </div>
            <div className="upgrade-text">
              <span className="upgrade-title">
                {plan === "trial" ? "Upgrade Plan" : "Go Premium"}
              </span>
              <span className="upgrade-sub">
                {plan === "trial"
                  ? "Unlock full screening power"
                  : "Claude AI + Anti-gaming"}
              </span>
            </div>
          </Link>
        )}

        {/* ── Divider ── */}
        <div className="sidebar-divider" />

        {/* ── Bottom nav ── */}
        <div className="sidebar-bottom">
          {BOTTOM_ITEMS.filter((i) => i.roles.includes(userRole)).map(
            (item) => {
              const Icon = item.icon;
              const active = isActive(item.href, false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  data-tooltip={item.label}
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            },
          )}
        </div>

        {/* ── User row ── */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{profile?.full_name ?? "User"}</span>
            <span className="user-role">{profile?.role ?? "member"}</span>
          </div>
          <button
            className="signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

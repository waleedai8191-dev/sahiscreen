"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MobileNavProps {
  userName: string;
  userEmail: string;
  userRole: string;
  companyName: string;
  plan: "trial" | "essential" | "premium" | "expired";
  cvUsed: number;
  cvLimit: number;
  trialDaysLeft?: number;
  profile: any;
  subscription: any;
}

// ─── Nav Config ──────────────────────────────────────────────────────────────

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "hr", "viewer"],
    exact: true,
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    icon: Briefcase,
    roles: ["admin", "hr", "viewer"],
    exact: false,
  },
  {
    href: "/dashboard/candidates",
    label: "Candidates",
    icon: Users,
    roles: ["admin", "hr", "viewer"],
    exact: false,
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ["admin"],
    exact: false,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin", "hr"],
    exact: false,
  },
];

const planConfig = {
  trial: { label: "Free Trial", color: "#f59e0b", bg: "#fef3c7" },
  essential: { label: "Essential", color: "#3b82f6", bg: "#dbeafe" },
  premium: { label: "Premium", color: "#7C3AED", bg: "#ede9fe" },
  expired: { label: "Expired", color: "#ef4444", bg: "#fee2e2" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MobileNav({
  userName,
  userEmail,
  userRole,
  companyName,
  plan,
  cvUsed,
  cvLimit,
  trialDaysLeft,
}: MobileNavProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const usagePercent = Math.min((cvUsed / cvLimit) * 100, 100);
  const usageColor =
    usagePercent >= 90 ? "#ef4444" : usagePercent >= 75 ? "#f59e0b" : "#22c55e";

  const planInfo = planConfig[plan];
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const visibleNav = navItems.filter((item) => item.roles.includes(userRole));

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <style>{`
        /* ── Sheet override ── */
        [data-radix-dialog-overlay] {
          background: rgba(0, 0, 0, 0.55) !important;
          backdrop-filter: blur(4px);
        }

        /* ── Slide-in animation ── */
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .mobile-sheet-inner {
          animation: slideInLeft 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ── Hamburger button ── */
        .ham-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ham-btn:hover {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        /* ── Drawer content ── */
        .drawer-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0;
          background: #0f172a;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Drawer header ── */
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .drawer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drawer-logo-text {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .drawer-close-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          cursor: pointer;
          border: none;
          color: #94a3b8;
          transition: background 0.2s, color 0.2s;
        }
        .drawer-close-btn:hover {
          background: rgba(255,255,255,0.13);
          color: #fff;
        }

        /* ── Company chip ── */
        .company-chip {
          margin: 14px 20px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .company-chip-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .company-chip-name {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .plan-badge-mobile {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
        }
        .plan-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* ── Nav section ── */
        .drawer-nav {
          flex: 1;
          padding: 8px 12px;
          overflow-y: auto;
        }
        .nav-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #475569;
          text-transform: uppercase;
          padding: 8px 8px 6px;
        }
        .nav-item-mobile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          text-decoration: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
          transition: background 0.18s, color 0.18s;
          position: relative;
        }
        .nav-item-mobile:hover {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
        }
        .nav-item-mobile.active {
          background: rgba(124, 58, 237, 0.18);
          color: #a78bfa;
        }
        .nav-item-mobile.active .nav-icon-mobile {
          color: #7C3AED;
        }
        .active-pip {
          position: absolute;
          right: 14px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7C3AED;
        }
        .nav-icon-mobile {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        /* ── Usage bar ── */
        .usage-section {
          margin: 4px 12px 0;
          padding: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .usage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .usage-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .usage-count {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }
        .usage-bar-track {
          height: 5px;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          overflow: hidden;
        }
        .usage-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.6s ease;
        }

        /* ── Trial upgrade CTA ── */
        .upgrade-cta-mobile {
          margin: 10px 12px 0;
          padding: 12px 14px;
          background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(91,33,182,0.15));
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .upgrade-cta-mobile:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(91,33,182,0.25));
        }
        .upgrade-cta-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .upgrade-cta-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .upgrade-cta-title {
          font-size: 12px;
          font-weight: 700;
          color: #a78bfa;
        }
        .upgrade-cta-sub {
          font-size: 11px;
          color: #64748b;
        }

        /* ── User row ── */
        .user-row-mobile {
          margin: 12px;
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar-mobile {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7C3AED, #5b21b6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .user-info-mobile {
          flex: 1;
          min-width: 0;
        }
        .user-name-mobile {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-email-mobile {
          font-size: 11px;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .signout-btn-mobile {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(239,68,68,0.1);
          border: none;
          cursor: pointer;
          color: #f87171;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .signout-btn-mobile:hover {
          background: rgba(239,68,68,0.2);
        }
        .signout-btn-mobile:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* ── Trigger ── */}
        <SheetTrigger asChild>
          <button className="ham-btn" aria-label="Open navigation">
            <Menu size={18} color="#374151" />
          </button>
        </SheetTrigger>

        {/* ── Drawer ── */}
        <SheetContent
          side="left"
          className="p-0 border-0 w-[280px] max-w-[85vw]"
          style={{ background: "#0f172a" }}
        >
          <div className="drawer-wrap mobile-sheet-inner">
            {/* Header */}
            <div className="drawer-header">
              <div className="drawer-logo">
                <div className="drawer-logo-icon">
                  <Zap size={18} color="#fff" />
                </div>
                <span className="drawer-logo-text">SahiScreen</span>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>

            {/* Company chip */}
            <div className="company-chip">
              <div className="company-chip-left">
                <span className="company-chip-name">{companyName}</span>
                <span
                  className="plan-badge-mobile"
                  style={{
                    background: planInfo.bg + "33",
                    color: planInfo.color,
                  }}
                >
                  <span
                    className="plan-dot"
                    style={{ background: planInfo.color }}
                  />
                  {planInfo.label}
                  {plan === "trial" && trialDaysLeft !== undefined
                    ? ` · ${trialDaysLeft}d left`
                    : ""}
                </span>
              </div>
              <ChevronRight size={14} color="#475569" />
            </div>

            {/* Nav */}
            <nav className="drawer-nav">
              <div className="nav-section-label">Navigation</div>
              {visibleNav.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item-mobile${active ? " active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="nav-icon-mobile" />
                    {item.label}
                    {active && <span className="active-pip" />}
                  </Link>
                );
              })}
            </nav>

            {/* Usage meter */}
            <div className="usage-section">
              <div className="usage-header">
                <span className="usage-label">CV Usage</span>
                <span className="usage-count">
                  {cvUsed.toLocaleString()} / {cvLimit.toLocaleString()}
                </span>
              </div>
              <div className="usage-bar-track">
                <div
                  className="usage-bar-fill"
                  style={{
                    width: `${usagePercent}%`,
                    background: usageColor,
                  }}
                />
              </div>
            </div>

            {/* Upgrade CTA — shown for trial & essential admin */}
            {(plan === "trial" || plan === "essential") &&
              userRole === "admin" && (
                <Link
                  href="/dashboard/billing"
                  className="upgrade-cta-mobile"
                  onClick={() => setOpen(false)}
                >
                  <div className="upgrade-cta-icon">
                    <Zap size={14} color="#fff" />
                  </div>
                  <div className="upgrade-cta-text">
                    <span className="upgrade-cta-title">
                      {plan === "trial" ? "Upgrade Plan" : "Go Premium"}
                    </span>
                    <span className="upgrade-cta-sub">
                      {plan === "trial"
                        ? "Unlock full access"
                        : "Claude 3.5 Sonnet AI"}
                    </span>
                  </div>
                  <ChevronRight size={14} color="#7C3AED" />
                </Link>
              )}

            {/* User row */}
            <div className="user-row-mobile">
              <div className="user-avatar-mobile">{initials}</div>
              <div className="user-info-mobile">
                <div className="user-name-mobile">{userName}</div>
                <div className="user-email-mobile">{userEmail}</div>
              </div>
              <button
                className="signout-btn-mobile"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
              >
                {signingOut ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <LogOut size={14} />
                )}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

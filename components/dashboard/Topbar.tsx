"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  CreditCard,
  LogOut,
  User,
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Zap,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { UserProfile, SubscriptionStatus } from "@/lib/supabase/types";
import {
  AppNotification,
  cvSubmittedNotif,
  milestonNotif,
  relativeTime,
  screeningCompleteNotif,
  usageWarningNotif,
} from "@/lib/supabase/notifications";

// ── Props ─────────────────────────────────────────────────

interface TopbarProps {
  profile: UserProfile | null;
  subscription: SubscriptionStatus | null;
}

// ── Page title map ────────────────────────────────────────

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of your hiring activity",
  },
  "/dashboard/jobs": { title: "Jobs", description: "Manage your job postings" },
  "/dashboard/candidates": {
    title: "Candidates",
    description: "CV uploads and screening results",
  },
  "/dashboard/billing": {
    title: "Billing",
    description: "Manage your plan and payments",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Manage your profile",
  },
  "/dashboard/support": {
    title: "Help & Support",
    description: "Get help with SahiScreen",
  },
};

const NOTIF_ICONS = {
  success: { icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
  info: { icon: Info, color: "#3b82f6", bg: "#eff6ff" },
  error: { icon: X, color: "#ef4444", bg: "#fef2f2" },
};

// ── Component ─────────────────────────────────────────────

export default function Topbar({ profile, subscription }: TopbarProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const shownMilestones = useRef<Set<number>>(new Set());

  const pageMeta = PAGE_TITLES[pathname] ?? {
    title: "Dashboard",
    description: "",
  };
  const unread = notifications.filter((n) => !n.read).length;

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const pushNotif = useCallback((notif: AppNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 30);
    });
  }, []);

  // Load initial notifications from API
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.notifications) {
          const hydrated: AppNotification[] = data.notifications.map(
            (n: AppNotification) => ({
              ...n,
              createdAt: new Date(n.createdAt),
              time: relativeTime(new Date(n.createdAt)),
            }),
          );
          setNotifications(hydrated);
        }
      } finally {
        if (!cancelled) setNotifsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile) return;
    const companyId = (profile as any).company_id;
    if (!companyId) return;

    const cvChannel = supabase
      .channel(`cv-uploads-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cv_uploads",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.source === "apply_link") pushNotif(cvSubmittedNotif(row));
        },
      )
      .subscribe();

    const screeningChannel = supabase
      .channel(`screening-results-${companyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "screening_results" },
        async (payload) => {
          const row = payload.new as any;
          if (row.status !== "completed") return;
          const { data: cv } = await supabase
            .from("cv_uploads")
            .select("candidate_name, company_id")
            .eq("id", row.candidate_id)
            .single();
          if (!cv || cv.company_id !== companyId) return;
          pushNotif(screeningCompleteNotif(row, cv.candidate_name));
        },
      )
      .subscribe();

    const subChannel = supabase
      .channel(`subscription-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const { cv_count_current: current, cv_limit_monthly: limit } = row;
          if (!current || !limit) return;
          const pct = current / limit;
          if (pct >= 0.8) pushNotif(usageWarningNotif(current, limit));
          if (
            current > 0 &&
            current % 100 === 0 &&
            !shownMilestones.current.has(current)
          ) {
            shownMilestones.current.add(current);
            pushNotif(milestonNotif(current));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cvChannel);
      supabase.removeChannel(screeningChannel);
      supabase.removeChannel(subChannel);
    };
  }, [profile, supabase, pushNotif]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const handleSignOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  };

  const plan = subscription?.plan ?? "trial";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .topbar {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          gap: 16px;
        }

        /* ── Left: page title ── */
        .topbar-left {}

        .topbar-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.4px;
          line-height: 1.2;
          margin: 0;
        }

        .topbar-desc {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
          margin: 0;
          line-height: 1.4;
        }

        /* ── Right: actions ── */
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ── Search bar ── */
        .search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1.5px solid #f1f5f9;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
        }

        .search-trigger:hover {
          border-color: #e2e8f0;
          background: #f1f5f9;
        }

        .search-trigger-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 400;
          flex: 1;
        }

        .search-kbd {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 1px 5px;
        }

        /* Search overlay */
        .search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.5);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 80px;
          animation: fade-in 0.15s ease;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .search-modal {
          width: 100%;
          max-width: 560px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: slide-down 0.2s ease;
          margin: 0 20px;
        }

        @keyframes slide-down {
          from { transform: translateY(-12px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        .search-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          color: #0f172a;
          background: transparent;
        }

        .search-input::placeholder { color: #94a3b8; }

        .search-close {
          background: #f1f5f9;
          border: none;
          border-radius: 7px;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }

        .search-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .search-hints {
          padding: 12px 20px 16px;
        }

        .search-hint-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .search-hint-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .search-hint-chip {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 5px 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          display: inline-block;
        }

        .search-hint-chip:hover {
          border-color: #7C3AED;
          color: #7C3AED;
          background: #faf5ff;
        }

        /* ── Icon buttons ── */
        .topbar-icon-btn {
          position: relative;
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1.5px solid #f1f5f9;
          background: #f8fafc;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .topbar-icon-btn:hover {
          border-color: #e2e8f0;
          background: #f1f5f9;
          color: #0f172a;
        }

        .topbar-icon-btn.active {
          border-color: #ddd6fe;
          background: #f3f0ff;
          color: #7C3AED;
        }

        .notif-badge {
          position: absolute;
          top: -4px; right: -4px;
          width: 17px; height: 17px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px;
          font-weight: 800;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Notification dropdown ── */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
          z-index: 100;
          overflow: hidden;
          animation: dropdown-in 0.15s ease;
        }

        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0);     }
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .notif-header-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .notif-mark-all {
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0;
          transition: opacity 0.2s;
        }

        .notif-mark-all:hover { opacity: 0.7; }

        .notif-list {}

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #f8fafc;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
        }

        .notif-item:last-child { border-bottom: none; }

        .notif-item:hover { background: #fafafa; }

        .notif-item.unread { background: #faf5ff; }
        .notif-item.unread:hover { background: #f3f0ff; }

        .notif-unread-dot {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 7px; height: 7px;
          background: #7C3AED;
          border-radius: 50%;
        }

        .notif-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .notif-content {}

        .notif-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .notif-message {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 4px;
        }

        .notif-time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .notif-empty {
          padding: 32px 18px;
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
        }

        /* ── User menu ── */
        .user-menu-wrap {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px 6px 6px;
          border-radius: 10px;
          border: 1.5px solid #f1f5f9;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-menu-trigger:hover {
          border-color: #e2e8f0;
          background: #f1f5f9;
        }

        .user-menu-trigger.open {
          border-color: #ddd6fe;
          background: #f3f0ff;
        }

        .user-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .user-menu-name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-menu-chevron {
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .user-menu-trigger.open .user-menu-chevron {
          transform: rotate(180deg);
        }

        /* Dropdown */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
          z-index: 100;
          overflow: hidden;
          animation: dropdown-in 0.15s ease;
        }

        .user-dropdown-header {
          padding: 14px 16px 10px;
          border-bottom: 1px solid #f1f5f9;
        }

        .udh-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .udh-email {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .udh-plan {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 100px;
        }

        .user-dropdown-items {
          padding: 6px;
        }

        .ud-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          transition: all 0.15s ease;
        }

        .ud-item:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .ud-item.danger {
          color: #ef4444;
        }

        .ud-item.danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .ud-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 4px 6px;
        }

        @media (max-width: 1024px) {
          .search-trigger { min-width: 140px; }
          .search-kbd { display: none; }
          .topbar { padding: 0 20px; }
        }

        @media (max-width: 640px) {
          .search-trigger { display: none; }
          .user-menu-name { display: none; }
          .user-menu-chevron { display: none; }
          .topbar { padding: 0 16px; }
        }
      `}</style>

      <div className="topbar">
        {/* ── Left: Page title ── */}
        <div className="topbar-left">
          <h1 className="topbar-title">{pageMeta.title}</h1>
          {pageMeta.description && (
            <p className="topbar-desc">{pageMeta.description}</p>
          )}
        </div>

        {/* ── Right: Actions ── */}
        <div className="topbar-right">
          {/* Search trigger */}
          <div className="search-wrap">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
              type="button"
            >
              <Search size={14} color="#94a3b8" />
              <span className="search-trigger-text">Search...</span>
              <span className="search-kbd">⌘K</span>
            </button>
          </div>

          {/* Notifications */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              className={`topbar-icon-btn ${notifOpen ? "active" : ""}`}
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserMenuOpen(false);
              }}
              type="button"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-header-title">
                    Notifications {unread > 0 && `(${unread})`}
                  </span>
                  {unread > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map((notif) => {
                      const cfg = NOTIF_ICONS[notif.type];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={notif.id}
                          className={`notif-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => markRead(notif.id)}
                        >
                          <div
                            className="notif-icon"
                            style={{ background: cfg.bg }}
                          >
                            <Icon size={16} color={cfg.color} />
                          </div>
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-time">{notif.time}</div>
                          </div>
                          {!notif.read && <span className="notif-unread-dot" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="user-menu-wrap" ref={userRef}>
            <button
              className={`user-menu-trigger ${userMenuOpen ? "open" : ""}`}
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifOpen(false);
              }}
              type="button"
            >
              <div className="user-avatar">{initials}</div>
              <span className="user-menu-name">
                {profile?.full_name?.split(" ")[0] ?? "User"}
              </span>
              <ChevronDown size={13} className="user-menu-chevron" />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                {/* Header */}
                <div className="user-dropdown-header">
                  <div className="udh-name">{profile?.full_name ?? "User"}</div>
                  <div className="udh-email">{profile?.email ?? ""}</div>
                  <span
                    className="udh-plan"
                    style={{
                      background:
                        plan === "premium"
                          ? "rgba(167,139,250,0.15)"
                          : plan === "essential"
                            ? "rgba(59,130,246,0.15)"
                            : plan === "trial"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(148,163,184,0.15)",
                      color:
                        plan === "premium"
                          ? "#a78bfa"
                          : plan === "essential"
                            ? "#3b82f6"
                            : plan === "trial"
                              ? "#f59e0b"
                              : "#94a3b8",
                    }}
                  >
                    <Zap size={10} />
                    {plan === "trial"
                      ? "Free Trial"
                      : plan === "essential"
                        ? "Essential"
                        : plan === "premium"
                          ? "Premium"
                          : "Expired"}
                  </span>
                </div>

                {/* Items */}
                <div className="user-dropdown-items">
                  <Link
                    href="/dashboard/settings"
                    className="ud-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User size={15} /> Profile & Settings
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="ud-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <CreditCard size={15} /> Billing & Plan
                  </Link>
                  <Link
                    href="/dashboard/support"
                    className="ud-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <HelpCircle size={15} /> Help & Support
                  </Link>

                  <div className="ud-divider" />

                  <button
                    className="ud-item danger"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <LogOut size={15} />
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-row">
              <Search size={18} color="#94a3b8" />
              <input
                ref={searchRef}
                className="search-input"
                placeholder="Search jobs, candidates, settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="search-close"
                onClick={() => setSearchOpen(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="search-hints">
              <div className="search-hint-label">Quick Links</div>
              <div className="search-hint-items">
                {[
                  { label: "📋 All Jobs", href: "/dashboard/jobs" },
                  { label: "👥 Candidates", href: "/dashboard/candidates" },
                  { label: "💳 Billing", href: "/dashboard/billing" },
                  { label: "⚙️ Settings", href: "/dashboard/settings" },
                  { label: "➕ New Job", href: "/dashboard/jobs/new" },
                  { label: "📤 Upload CVs", href: "/dashboard/candidates" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="search-hint-chip"
                    onClick={() => setSearchOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

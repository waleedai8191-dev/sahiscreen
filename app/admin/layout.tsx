"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Zap,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & stats",
  },
  {
    href: "/admin/users",
    label: "HR Users",
    icon: Users,
    description: "All HR users",
  },
  {
    href: "/admin/companies",
    label: "Companies",
    icon: Building2,
    description: "All workspaces",
  },
  {
    href: "/admin/data-history",
    label: "Data History",
    icon: CreditCard,
    description: "CVs, Jobs & Screenings",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on outside click (handled via overlay)
  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <Link href="/admin/dashboard" className="admin-logo">
        <div className="admin-logo-icon">
          <Zap size={16} color="#fff" />
        </div>
        <div>
          <div className="admin-logo-text">SahiScreen</div>
          <div className="admin-logo-badge">Admin</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="admin-nav">
        <div className="admin-nav-section">Main</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item${isActive ? " active" : ""}`}
            >
              <div className="admin-nav-icon">
                <Icon
                  size={15}
                  color={isActive ? "#a78bfa" : "rgba(255,255,255,0.4)"}
                />
              </div>
              <div>
                <div className="admin-nav-label">{item.label}</div>
                <div className="admin-nav-desc">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="admin-logout-btn"
        >
          <LogOut size={14} />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Sidebar desktop ── */
        .admin-sidebar {
          width: 240px;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          overflow-y: auto;
          transition: transform 0.25s ease;
        }

        /* ── Sidebar mobile overlay ── */
        .admin-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 49;
          backdrop-filter: blur(2px);
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          text-decoration: none;
          flex-shrink: 0;
        }

        .admin-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-logo-text {
          font-size: 14px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.3px;
        }

        .admin-logo-badge {
          font-size: 9px;
          font-weight: 700;
          background: rgba(124,58,237,0.3);
          border: 1px solid rgba(124,58,237,0.4);
          color: #a78bfa;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-nav {
          padding: 12px 8px;
          flex: 1;
        }

        .admin-nav-section {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 8px 10px 6px;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 9px;
          text-decoration: none;
          transition: background 0.15s;
          margin-bottom: 2px;
          border: 1px solid transparent;
        }

        .admin-nav-item:hover {
          background: rgba(255,255,255,0.06);
        }

        .admin-nav-item.active {
          background: rgba(124,58,237,0.2);
          border-color: rgba(124,58,237,0.25);
        }

        .admin-nav-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(255,255,255,0.05);
        }

        .admin-nav-item.active .admin-nav-icon {
          background: rgba(124,58,237,0.3);
        }

        .admin-nav-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
        }

        .admin-nav-item.active .admin-nav-label {
          color: #e2e8f0;
        }

        .admin-nav-desc {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          margin-top: 1px;
        }

        .admin-sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .admin-logout-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
          border-radius: 9px;
          text-decoration: none;
          transition: background 0.15s;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          font-weight: 600;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .admin-logout-btn:hover {
          background: rgba(239,68,68,0.15);
          color: #fca5a5;
        }

        .admin-logout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Main content ── */
        .admin-main {
          margin-left: 240px;
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .admin-topbar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 40;
          gap: 12px;
        }

        .admin-topbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          min-width: 0;
        }

        .admin-topbar-sep {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #cbd5e1;
          flex-shrink: 0;
        }

        .admin-topbar-page {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-superadmin-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.15);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #7c3aed;
          flex-shrink: 0;
        }

        .admin-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ── Page content ── */
        .admin-content {
          padding: 28px 32px 60px;
          flex: 1;
        }

        /* ── Mobile close button inside sidebar ── */
        .admin-sidebar-close {
          display: none;
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          cursor: pointer;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
        }

        /* ── Responsive breakpoints ── */
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            width: 260px;
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .admin-sidebar-overlay.open {
            display: block;
          }

          .admin-sidebar-close {
            display: flex;
          }

          .admin-main {
            margin-left: 0;
          }

          .admin-hamburger {
            display: flex;
          }

          .admin-content {
            padding: 20px 16px 48px;
          }

          .admin-topbar {
            padding: 0 16px;
          }

          .admin-superadmin-badge span {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .admin-topbar-sep,
          .admin-topbar-left > span:first-child {
            display: none;
          }
        }
      `}</style>

      <div className="admin-shell">
        {/* Mobile overlay */}
        <div
          className={`admin-sidebar-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`admin-sidebar${sidebarOpen ? " open" : ""}`}
          style={{ position: "fixed" }}
        >
          {/* Mobile close button */}
          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={14} />
          </button>

          <SidebarContent />
        </aside>

        {/* Main */}
        <div className="admin-main">
          {/* Top bar */}
          <div className="admin-topbar">
            <div className="admin-topbar-left">
              {/* Hamburger — mobile only */}
              <button
                className="admin-hamburger"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={17} color="#374151" />
              </button>

              <span style={{ color: "#64748b", fontSize: 13 }}>SahiScreen</span>
              <span className="admin-topbar-sep" />
              <span className="admin-topbar-page">
                {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ??
                  "Admin Panel"}
              </span>
            </div>

            <div className="admin-superadmin-badge">
              <Shield size={11} />
              <span>Superadmin</span>
            </div>
          </div>

          {/* Content */}
          <div className="admin-content">{children}</div>
        </div>
      </div>
    </>
  );
}

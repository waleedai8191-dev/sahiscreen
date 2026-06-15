"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "../Style/Admin/AdminLayout.module.css";
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <Link href="/admin/dashboard" className={styles.adminLogo}>
        <div className={styles.adminLogoIcon}>
          <Zap size={16} color="#fff" />
        </div>
        <div>
          <div className={styles.adminLogoText}>SahiScreen</div>
          <div className={styles.adminLogoBadge}>Admin</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className={styles.adminNav}>
        <div className={styles.adminNavSection}>Main</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.adminNavItem}${isActive ? ` ${styles.active}` : ""}`}
            >
              <div className={styles.adminNavIcon}>
                <Icon
                  size={15}
                  color={isActive ? "#a78bfa" : "rgba(255,255,255,0.4)"}
                />
              </div>
              <div>
                <div className={styles.adminNavLabel}>{item.label}</div>
                <div className={styles.adminNavDesc}>{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.adminSidebarFooter}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={styles.adminLogoutBtn}
        >
          <LogOut size={14} />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.adminShell}>
      {/* Mobile overlay */}
      <div
        className={`${styles.adminSidebarOverlay}${sidebarOpen ? ` ${styles.open}` : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`${styles.adminSidebar}${sidebarOpen ? ` ${styles.open}` : ""}`}
      >
        {/* Mobile close button */}
        <button
          className={styles.adminSidebarClose}
          onClick={() => setSidebarOpen(false)}
        >
          <X size={14} />
        </button>

        <SidebarContent />
      </aside>

      {/* Main */}
      <div className={styles.adminMain}>
        {/* Top bar */}
        <div className={styles.adminTopbar}>
          <div className={styles.adminTopbarLeft}>
            <button
              className={styles.adminHamburger}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={17} color="#374151" />
            </button>
            <span style={{ color: "#64748b", fontSize: 13 }}>SahiScreen</span>
            <span className={styles.adminTopbarSep} />
            <span className={styles.adminTopbarPage}>
              {NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ??
                "Admin Panel"}
            </span>
          </div>
          <div className={styles.adminSuperadminBadge}>
            <Shield size={11} />
            <span>Superadmin</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.adminContent}>{children}</div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import {
  requireAuth,
  getUserProfile,
  getSubscriptionStatus,
} from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import MobileNav from "@/components/dashboard/MobileNav";

export const metadata: Metadata = {
  title: {
    template: "%s | SahiScreen Dashboard",
    default: "Dashboard | SahiScreen",
  },
  description: "SahiScreen AI-powered CV screening dashboard.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ───────────────────────────────────────────
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);
  const subscription = profile?.company_id
    ? await getSubscriptionStatus(profile.company_id)
    : null;

  // ── Trial banner logic ───────────────────────────────────
  const showTrialBanner =
    subscription?.plan === "trial" &&
    subscription?.status === "trialing" &&
    subscription?.trial_ends_at != null;

  const trialDaysLeft = showTrialBanner
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription!.trial_ends_at!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const isExpired =
    subscription?.status === "expired" ||
    subscription?.plan === "expired" ||
    (subscription?.plan === "trial" && trialDaysLeft === 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Root shell ── */
        .dash-shell {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Sidebar column ── */
        .dash-sidebar-col {
          width: 260px;
          flex-shrink: 0;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          transition: width 0.25s ease;
        }

        .dash-sidebar-col.collapsed {
          width: 72px;
        }

        /* ── Main column ── */
        .dash-main-col {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: margin-left 0.25s ease;
        }

        .dash-main-col.sidebar-collapsed {
          margin-left: 72px;
        }

        /* ── Topbar ── */
        .dash-topbar-wrap {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        /* ── Trial banner ── */
        .trial-banner {
          background: linear-gradient(135deg, #7C3AED, #6d28d9);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .trial-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .trial-banner-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .trial-banner-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          line-height: 1.4;
        }

        .trial-banner-text strong {
          color: #ffffff;
          font-weight: 700;
        }

        .trial-banner-days {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 100px;
          padding: 2px 10px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
        }

        .trial-banner-days.urgent {
          background: rgba(239,68,68,0.3);
          border-color: rgba(239,68,68,0.5);
          animation: pulse-urgent 2s ease-in-out infinite;
        }

        @keyframes pulse-urgent {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .trial-banner-btn {
          background: #ffffff;
          color: #7C3AED;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .trial-banner-btn:hover {
          background: #f3f0ff;
          transform: translateY(-1px);
        }

        /* ── Expired banner ── */
        .expired-banner {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .expired-banner-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .expired-banner-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
        }

        .expired-banner-text strong {
          color: #ffffff;
          font-weight: 700;
        }

        .expired-banner-btn {
          background: #ffffff;
          color: #dc2626;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .expired-banner-btn:hover {
          background: #fef2f2;
          transform: translateY(-1px);
        }

        /* ── Page content ── */
        .dash-content {
          flex: 1;
          padding: 28px 32px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── Mobile topbar ── */
        .dash-mobile-topbar {
          display: none;
          position: sticky;
          top: 0;
          z-index: 40;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          padding: 0 20px;
          height: 60px;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .mobile-logo-icon {
          width: 28px;
          height: 28px;
          background: #7C3AED;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mobile-logo-text {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        /* ── Responsive ── */
     @media (max-width: 1024px) {
  .dash-sidebar-col {
    width: 72px;
  }
  .dash-main-col {
    margin-left: 72px;
  }
}

@media (max-width: 767px) {
  /* Sidebar column becomes zero-width — 
     the drawer in Sidebar.tsx renders outside 
     normal flow via position:fixed, so it still shows */
  .dash-sidebar-col {
    width: 0;
    overflow: visible;  /* critical — lets fixed children escape */
  }
  .dash-main-col {
    margin-left: 0;
    padding-top: 56px; /* clears the mobile topbar from Sidebar.tsx */
  }
  /* Hide desktop topbar on mobile */
  .dash-topbar-wrap {
    display: none;
  }
  .dash-content {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .dash-content {
    padding: 16px 12px;
  }
}
        @media (max-width: 480px) {
          .dash-content {
            padding: 16px 12px;
          }
        }
      `}</style>

      <div className="dash-shell">
        {/* ── Desktop Sidebar ── */}
        <div className="dash-sidebar-col">
          <Sidebar profile={profile} subscription={subscription} />
        </div>

        {/* ── Main column ── */}
        <div className="dash-main-col">
          {/* Mobile topbar */}
          <div className="dash-mobile-topbar">
            <a href="/dashboard" className="mobile-logo">
              <div className="mobile-logo-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </div>
              <span className="mobile-logo-text">SahiScreen</span>
            </a>
            {/* Mobile Nav Sheet */}
            {/* <MobileNav profile={profile} subscription={subscription} /> */}
          </div>

          {/* Desktop Topbar */}
          <div className="dash-topbar-wrap">
            {/* Trial banner */}
            {showTrialBanner && !isExpired && (
              <div className="trial-banner">
                <div className="trial-banner-left">
                  <span className="trial-banner-icon">⏳</span>
                  <span className="trial-banner-text">
                    <strong>Free Trial</strong> — You have{" "}
                    {subscription?.cv_limit -
                      (subscription?.cvs_used_this_month ?? 0)}{" "}
                    CVs remaining and your trial ends in
                  </span>
                  <span
                    className={`trial-banner-days ${trialDaysLeft <= 3 ? "urgent" : ""}`}
                  >
                    {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left
                  </span>
                </div>
                <a href="/dashboard/billing" className="trial-banner-btn">
                  Upgrade Now →
                </a>
              </div>
            )}

            {/* Expired banner */}
            {isExpired && (
              <div className="expired-banner">
                <div className="expired-banner-left">
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span className="expired-banner-text">
                    <strong>Trial Expired —</strong> Your account is now
                    read-only. Upgrade to continue screening CVs.
                  </span>
                </div>
                <a href="/dashboard/billing" className="expired-banner-btn">
                  Choose a Plan →
                </a>
              </div>
            )}

            <Topbar profile={profile} subscription={subscription} />
          </div>

          {/* Page content */}
          <main className="dash-content">{children}</main>
        </div>
      </div>
    </>
  );
}

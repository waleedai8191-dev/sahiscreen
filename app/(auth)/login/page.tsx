"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── 1. ALL state first ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingSession, setCheckingSession] = useState(true);
  const [failCount, setFailCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (searchParams.get("deactivated") === "true") {
      setErrors({
        general:
          "Your account has been deactivated. Please contact SahiScreen support team.",
      });
    }
  }, [searchParams]);
  // ── 2. useEffects after state ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "superadmin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/dashboard");
        }
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSeconds(0);
        clearInterval(interval);
      } else {
        setLockoutSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Lockout duration increases with each failure
  // 1-2 fails → no lockout, just warning
  // 3 fails   → 30 seconds
  // 4 fails   → 2 minutes
  // 5+ fails  → 10 minutes
  function getLockoutMs(attempts: number): number {
    if (attempts < 3) return 0;
    if (attempts === 3) return 30 * 1000;
    if (attempts === 4) return 2 * 60 * 1000;
    return 10 * 60 * 1000;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email address";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block if currently locked out
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setErrors({
        general: `Too many failed attempts. Please wait ${lockoutSeconds} seconds before trying again.`,
      });
      return;
    }

    if (!validate()) return;
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient(!rememberMe);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (error) throw error;

      if (data.user) {
        // Success — reset fail counter
        setFailCount(0);
        setLockoutUntil(null);

        if (!rememberMe && data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          sessionStorage.setItem("session_temporary", "true");
        }

        const { data: profile } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", data.user.id)
          .single();
        if (profile?.is_active === false) {
          await supabase.auth.signOut();
          setErrors({
            general:
              "Your account has been deactivated. Please contact SahiScreen support team.",
          });
          return;
        }

        if (profile?.role === "superadmin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      const msg = err.message || "";

      // Only count credential failures — not network errors
      const isCredentialError =
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credentials") ||
        msg.toLowerCase().includes("password");

      if (isCredentialError) {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);

        const lockoutMs = getLockoutMs(newFailCount);

        if (lockoutMs > 0) {
          // Apply lockout
          const until = Date.now() + lockoutMs;
          setLockoutUntil(until);
          setLockoutSeconds(Math.ceil(lockoutMs / 1000));

          const minutes = Math.round(lockoutMs / 60000);
          const timeLabel =
            lockoutMs < 60000
              ? `${Math.ceil(lockoutMs / 1000)} seconds`
              : `${minutes} minute${minutes !== 1 ? "s" : ""}`;

          setErrors({
            general: `Too many failed attempts. Please wait ${timeLabel} before trying again.`,
          });
        } else {
          // Under threshold — show attempts remaining
          const attemptsLeft = 3 - newFailCount;
          setErrors({
            general:
              attemptsLeft > 0
                ? `Incorrect email or password.Please try again  .`
                : "Incorrect email or password. Please try again.",
          });
        }
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        setErrors({
          general: "Please confirm your email address before signing in.",
        });
      } else {
        setErrors({ general: msg || "Sign in failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while session check runs — prevents form flash
  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #e2e8f0",
            borderTopColor: "#7C3AED",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .login-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
        }

        /* Heading */
        .login-title {
          font-size: 30px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.8px;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .login-subtitle {
          font-size: 14px;
          color: #64748b;
          font-weight: 400;
          margin-bottom: 28px;
          line-height: 1.6;
        }

        .login-subtitle a {
          color: #7C3AED;
          font-weight: 600;
          text-decoration: none;
        }

        .login-subtitle a:hover {
          text-decoration: underline;
        }

        /* Google btn */
        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }

        .btn-google:hover {
          border-color: #c4b5fd;
          background: #faf5ff;
          box-shadow: 0 2px 12px rgba(124,58,237,0.1);
        }

        .btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .auth-divider-text {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
          white-space: nowrap;
        }

        /* General error */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #dc2626;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.5;
        }

        /* Form */
        .form-group {
          margin-bottom: 16px;
        }

        .form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .forgot-link {
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }

        .form-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 14px 11px 38px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: #7C3AED;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }

        .form-input.error-input {
          border-color: #fca5a5;
          background: #fff5f5;
        }

        .form-input.error-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }

        .input-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.2s;
        }

        .input-eye:hover {
          color: #7C3AED;
        }

        .field-error {
          font-size: 12px;
          font-weight: 500;
          color: #ef4444;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Remember me row */
        .remember-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .remember-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #7C3AED;
          cursor: pointer;
          flex-shrink: 0;
          border-radius: 4px;
        }

        .remember-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          user-select: none;
        }

        /* Submit btn */
        .btn-submit {
          width: 100%;
          background: #7C3AED;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
          transition: all 0.2s ease;
          margin-bottom: 20px;
          letter-spacing: -0.2px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #6d28d9;
          box-shadow: 0 6px 24px rgba(124,58,237,0.45);
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Register link */
        .register-link {
          text-align: center;
          font-size: 14px;
          color: #64748b;
          font-weight: 400;
          margin-bottom: 20px;
        }

        .register-link a {
          color: #7C3AED;
          font-weight: 600;
          text-decoration: none;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        /* Trial nudge */
        .trial-nudge {
          background: linear-gradient(135deg, #f3f0ff, #faf5ff);
          border: 1px solid #ddd6fe;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .trial-nudge-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .trial-nudge-text {
          font-size: 13px;
          color: #5b21b6;
          font-weight: 500;
          line-height: 1.5;
        }

        .trial-nudge-text strong {
          font-weight: 700;
          color: #4c1d95;
        }

        .trial-nudge-text a {
          color: #7C3AED;
          font-weight: 700;
          text-decoration: none;
        }

        .trial-nudge-text a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-title { font-size: 24px; }
        }
      `}</style>

      <div className="login-wrap">
        {/* Heading */}
        <h1 className="login-title">Welcome back 👋</h1>
        <p className="login-subtitle">
          Don't have an account?{" "}
          <Link href="/register">Start your free trial</Link>
        </p>

        {/* Google Button */}
        {/* <button
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          type="button"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </button> */}

        {/* Divider */}
        {/* <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or sign in with email</span>
          <div className="auth-divider-line" />
        </div> */}

        {/* General Error */}
        {errors.general && (
          <div className="error-banner">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrap">
              <span className="input-icon">
                <Mail size={15} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? "error-input" : ""}`}
                placeholder="ali@company.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="field-error">⚠ {errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="input-wrap">
              <span className="input-icon">
                <Lock size={15} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`form-input ${errors.password ? "error-input" : ""}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="field-error">⚠ {errors.password}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="remember-row">
            <input
              type="checkbox"
              id="rememberMe"
              className="remember-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="remember-label">
              Keep me signed in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit"
            disabled={
              loading || (lockoutUntil !== null && Date.now() < lockoutUntil)
            }
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading
              ? "Signing in..."
              : lockoutUntil && lockoutSeconds > 0
                ? `Try again in ${lockoutSeconds}s`
                : "Sign In →"}
          </button>
        </form>

        {/* Register link */}
        <p className="register-link">
          New to SahiScreen? <Link href="/register">Create a free account</Link>
        </p>
      </div>
    </>
  );
}

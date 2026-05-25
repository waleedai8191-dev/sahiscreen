"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  User,
  Mail,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { label: "", color: "" },
      { label: "Weak", color: "#ef4444" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Good", color: "#3b82f6" },
      { label: "Strong", color: "#10b981" },
    ];
    return { score, ...map[score] };
  };

  const strength = getPasswordStrength(formData.password);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            company_name: formData.companyName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Supabase returns identities[] as empty when email already exists
      if (data.user && data.user.identities?.length === 0) {
        setErrors({
          general:
            "An account with this email already exists. Please sign in instead.",
        });
        return;
      }

      if (data.user) setSuccess(true);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("rate limit")) {
        setErrors({
          general: "Too many attempts. Please wait a minute and try again.",
        });
      } else {
        setErrors({
          general: msg || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrors({
        general: err.message || "Google sign-in failed. Please try again.",
      });
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .success-wrap {
            text-align: center;
            padding: 20px 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .success-icon-wrap {
            width: 72px;
            height: 72px;
            background: #f0fdf4;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .success-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin-bottom: 12px;
          }
          .success-desc {
            font-size: 15px;
            color: #64748b;
            line-height: 1.65;
            margin-bottom: 28px;
          }
          .success-desc strong { color: #0f172a; font-weight: 600; }
          .success-note {
            font-size: 13px;
            color: #94a3b8;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 18px;
            line-height: 1.6;
          }
        `}</style>
        <div className="success-wrap">
          <div className="success-icon-wrap">
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <h2 className="success-title">Check your email!</h2>
          <p className="success-desc">
            We sent a confirmation link to <strong>{formData.email}</strong>.
            <br />
            Click it to activate your 14-day free trial.
          </p>
          <p className="success-note">
            Didn't receive it? Check your spam folder or{" "}
            <a href="/register" style={{ color: "#7C3AED", fontWeight: 600 }}>
              try again
            </a>
            .
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .reg-wrap { font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }

        /* Trial banner */
        .trial-banner {
          background: linear-gradient(135deg, #f3f0ff, #faf5ff);
          border: 1px solid #ddd6fe;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .trial-banner-icon {
          width: 34px; height: 34px;
          background: #7C3AED;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
        .trial-banner-text { flex: 1; }
        .trial-banner-title {
          font-size: 13px; font-weight: 700; color: #0f172a;
          margin-bottom: 1px;
        }
        .trial-banner-sub {
          font-size: 11px; font-weight: 500; color: #7C3AED;
        }

        /* Heading */
        .reg-title {
          font-size: 28px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.8px; margin-bottom: 6px; line-height: 1.2;
        }
        .reg-subtitle {
          font-size: 14px; color: #64748b; font-weight: 400;
          margin-bottom: 28px; line-height: 1.6;
        }
        .reg-subtitle a {
          color: #7C3AED; font-weight: 600; text-decoration: none;
        }
        .reg-subtitle a:hover { text-decoration: underline; }

        /* Google btn */
        .btn-google {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 600; color: #0f172a;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }
        .btn-google:hover {
          border-color: #c4b5fd;
          background: #faf5ff;
          box-shadow: 0 2px 12px rgba(124,58,237,0.1);
        }
        .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

        .google-icon {
          width: 20px; height: 20px; flex-shrink: 0;
        }

        /* Divider */
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 20px;
        }
        .auth-divider-line {
          flex: 1; height: 1px; background: #f1f5f9;
        }
        .auth-divider-text {
          font-size: 12px; font-weight: 500; color: #94a3b8;
          white-space: nowrap;
        }

        /* General error */
        .error-banner {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; font-weight: 500; color: #dc2626;
          margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
        }

        /* Form rows */
        .form-row-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
        }

        .form-group { margin-bottom: 16px; }

        .form-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none; display: flex;
        }

        .form-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 14px 11px 38px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 400; color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-input::placeholder { color: #94a3b8; }
        .form-input:focus {
          border-color: #7C3AED;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .form-input.error-input { border-color: #fca5a5; background: #fff5f5; }
        .form-input.error-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }

        .input-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center; padding: 2px;
          transition: color 0.2s;
        }
        .input-eye:hover { color: #7C3AED; }

        .field-error {
          font-size: 12px; font-weight: 500; color: #ef4444;
          margin-top: 5px; display: flex; align-items: center; gap: 4px;
        }

        /* Password strength */
        .pwd-strength { margin-top: 8px; }
        .pwd-strength-bars {
          display: flex; gap: 4px; margin-bottom: 4px;
        }
        .pwd-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: #f1f5f9; transition: background 0.3s ease;
        }
        .pwd-strength-label {
          font-size: 11px; font-weight: 600; transition: color 0.3s;
        }

        /* Terms */
        .terms-text {
          font-size: 12px; color: #94a3b8; line-height: 1.6;
          margin-bottom: 16px; text-align: center;
        }
        .terms-text a { color: #7C3AED; text-decoration: none; font-weight: 500; }
        .terms-text a:hover { text-decoration: underline; }

        /* Submit btn */
        .btn-submit {
          width: 100%;
          background: #7C3AED;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
          transition: all 0.2s ease;
          margin-bottom: 16px;
          letter-spacing: -0.2px;
        }
        .btn-submit:hover:not(:disabled) {
          background: #6d28d9;
          box-shadow: 0 6px 24px rgba(124,58,237,0.45);
          transform: translateY(-1px);
        }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .signin-link {
          text-align: center;
          font-size: 14px; color: #64748b; font-weight: 400;
        }
        .signin-link a {
          color: #7C3AED; font-weight: 600; text-decoration: none;
        }
        .signin-link a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .form-row-2 { grid-template-columns: 1fr; }
          .reg-title { font-size: 24px; }
        }
      `}</style>

      <div className="reg-wrap">
        {/* Trial Banner */}
        <div className="trial-banner">
          <div className="trial-banner-icon">🎁</div>
          <div className="trial-banner-text">
            <div className="trial-banner-title">
              14-Day Free Trial — No Credit Card Required
            </div>
            <div className="trial-banner-sub">
              50 CVs included · Full access · Cancel anytime
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="reg-title">Create your account</h1>
        <p className="reg-subtitle">
          Already have an account? <Link href="/login">Sign in instead</Link>
        </p>

        {/* Google Button */}
        <button
          className="btn-google"
          onClick={handleGoogleSignup}
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
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or sign up with email</span>
          <div className="auth-divider-line" />
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="error-banner">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailSignup} noValidate>
          {/* Row: Full Name + Company */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Full Name
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <User size={15} />
                </span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className={`form-input ${errors.fullName ? "error-input" : ""}`}
                  placeholder="Ali Khan"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && (
                <p className="field-error">⚠ {errors.fullName}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="companyName">
                Company Name
              </label>
              <div className="input-wrap">
                <span className="input-icon">
                  <Building2 size={15} />
                </span>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className={`form-input ${errors.companyName ? "error-input" : ""}`}
                  placeholder="Acme Pakistan"
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="organization"
                />
              </div>
              {errors.companyName && (
                <p className="field-error">⚠ {errors.companyName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Work Email
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
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrap">
              <span className="input-icon">
                <Lock size={15} />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`form-input ${errors.password ? "error-input" : ""}`}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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
            {/* Strength meter */}
            {formData.password && (
              <div className="pwd-strength">
                <div className="pwd-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="pwd-bar"
                      style={{
                        background:
                          i <= strength.score ? strength.color : "#f1f5f9",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="pwd-strength-label"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            )}
            {errors.password && (
              <p className="field-error">⚠ {errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-wrap">
              <span className="input-icon">
                <Lock size={15} />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className={`form-input ${errors.confirmPassword ? "error-input" : ""}`}
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="field-error">⚠ {errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms */}
          <p className="terms-text">
            By signing up you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || googleLoading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Creating account..." : "Start Free Trial →"}
          </button>
        </form>

        {/* Sign in link */}
        <p className="signin-link">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </>
  );
}

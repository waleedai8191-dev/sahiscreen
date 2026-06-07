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

import { useSearchParams } from "next/navigation";
import { PLANS, type PlanTier } from "@/lib/plans";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planTier = (searchParams.get("plan") ?? "free") as PlanTier;
  const plan = PLANS[planTier] ?? PLANS.free;

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [confirmedPlan, setConfirmedPlan] = useState(plan);

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          companyName: formData.companyName.trim(),
          planTier: plan.tier,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result.error ?? "Something went wrong";
        if (
          msg.toLowerCase().includes("already registered") ||
          msg.toLowerCase().includes("already exists")
        ) {
          setErrors({
            general:
              "An account with this email already exists. Please sign in instead.",
          });
        } else if (msg.toLowerCase().includes("rate limit")) {
          setErrors({
            general: "Too many attempts. Please wait a minute and try again.",
          });
        } else {
          setErrors({ general: msg });
        }
        return;
      }
      sessionStorage.setItem("reg_pwd", formData.password);
      setConfirmedPlan(plan);
      router.push(
        `/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&plan=${plan.tier}`,
      );
    } catch (err: any) {
      setErrors({
        general: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

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
              {plan.tier === "free"
                ? "Free Forever — No Credit Card Required"
                : `${plan.name} Plan `}
            </div>
            <div className="trial-banner-sub">
              {plan.tier === "free"
                ? `${plan.cvLimit} CVs/mo · ${plan.jobLimit} active job · Free forever`
                : `${plan.cvLimit.toLocaleString()} CVs/mo · ${plan.jobLimit} active jobs · PKR ${plan.price.toLocaleString()}/mo `}
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="reg-title">Create your account</h1>
        <p className="reg-subtitle">
          Already have an account? <Link href="/login">Sign in instead</Link>
        </p>

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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading
              ? "Creating account..."
              : plan.tier === "free"
                ? "Create Free Account →"
                : `Create ${plan.name} Account →`}
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

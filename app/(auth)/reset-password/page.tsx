"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Verify Supabase session from reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setSessionError(true);
      } else {
        setSessionReady(true);
      }
    };
    checkSession();
  }, []);

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

  const passwordRules = [
    { label: "At least 8 characters", pass: formData.password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(formData.password) },
    { label: "One number", pass: /[0-9]/.test(formData.password) },
    {
      label: "Passwords match",
      pass:
        formData.password === formData.confirmPassword &&
        formData.confirmPassword.length > 0,
    },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (err: any) {
      setErrors({
        general: err.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Session error state ──
  if (sessionError) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .se-wrap {
            font-family: 'Plus Jakarta Sans', sans-serif;
            text-align: center;
            width: 100%;
          }
          .se-icon {
            width: 72px; height: 72px;
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
          }
          .se-title {
            font-size: 24px; font-weight: 800; color: #0f172a;
            letter-spacing: -0.5px; margin-bottom: 10px;
          }
          .se-desc {
            font-size: 14px; color: #64748b; line-height: 1.65;
            margin-bottom: 28px;
          }
          .se-btn {
            display: inline-flex; align-items: center; gap: 8px;
            background: #7C3AED; color: white;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 14px; font-weight: 600;
            padding: 12px 24px; border-radius: 10px;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(124,58,237,0.35);
            transition: all 0.2s ease;
          }
          .se-btn:hover {
            background: #6d28d9;
            transform: translateY(-1px);
          }
        `}</style>
        <div className="se-wrap">
          <div className="se-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h2 className="se-title">Link expired or invalid</h2>
          <p className="se-desc">
            This password reset link has expired or is no longer valid.
            <br />
            Request a new one to continue.
          </p>
          <Link href="/forgot-password" className="se-btn">
            Request New Link →
          </Link>
        </div>
      </>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .rp-success {
            font-family: 'Plus Jakarta Sans', sans-serif;
            text-align: center;
            width: 100%;
          }
          .rp-success-ring {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border: 2px solid #bbf7d0;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
            animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          @keyframes pop-in {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .rp-success-title {
            font-size: 26px; font-weight: 800; color: #0f172a;
            letter-spacing: -0.6px; margin-bottom: 10px;
          }
          .rp-success-desc {
            font-size: 15px; color: #64748b;
            line-height: 1.7; margin-bottom: 24px;
          }
          .rp-redirect-note {
            font-size: 13px; color: #94a3b8;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 18px;
            display: flex; align-items: center;
            justify-content: center; gap: 8px;
          }
          .rp-redirect-dot {
            width: 7px; height: 7px;
            background: #7C3AED; border-radius: 50%;
            animation: blink 1s ease-in-out infinite;
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div className="rp-success">
          <div className="rp-success-ring">
            <CheckCircle2 size={38} color="#10b981" />
          </div>
          <h2 className="rp-success-title">Password updated!</h2>
          <p className="rp-success-desc">
            Your password has been reset successfully.
            <br />
            You can now sign in with your new password.
          </p>
          <div className="rp-redirect-note">
            <span className="rp-redirect-dot" />
            Redirecting you to dashboard in 3 seconds...
          </div>
        </div>
      </>
    );
  }

  // ── Main form ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .rp-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
        }

        /* Icon header */
        .rp-icon-wrap {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #f3f0ff, #ede9fe);
          border: 1.5px solid #ddd6fe;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .rp-title {
          font-size: 28px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.8px; margin-bottom: 8px; line-height: 1.2;
        }

        .rp-subtitle {
          font-size: 14px; color: #64748b;
          font-weight: 400; line-height: 1.65;
          margin-bottom: 28px;
        }

        /* General error */
        .error-banner {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; font-weight: 500; color: #dc2626;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }

        /* Form */
        .form-group { margin-bottom: 18px; }

        .form-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #374151; margin-bottom: 6px;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; pointer-events: none; display: flex;
        }

        .form-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 40px 11px 38px;
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

        .form-input.error-input {
          border-color: #fca5a5;
          background: #fff5f5;
        }

        .form-input.error-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }

        .input-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center;
          padding: 2px; transition: color 0.2s;
        }

        .input-eye:hover { color: #7C3AED; }

        .field-error {
          font-size: 12px; font-weight: 500; color: #ef4444;
          margin-top: 5px; display: flex; align-items: center; gap: 4px;
        }

        /* Strength meter */
        .pwd-strength { margin-top: 8px; }
        .pwd-strength-bars { display: flex; gap: 4px; margin-bottom: 4px; }
        .pwd-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: #f1f5f9; transition: background 0.3s ease;
        }
        .pwd-strength-label {
          font-size: 11px; font-weight: 600; transition: color 0.3s;
        }

        /* Password rules checklist */
        .pwd-rules {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .pwd-rule {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 500;
          transition: color 0.2s ease;
        }

        .pwd-rule.pass { color: #10b981; }
        .pwd-rule.fail { color: #94a3b8; }

        .rule-dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease;
        }

        .pwd-rule.pass .rule-dot {
          background: #f0fdf4; border: 1.5px solid #86efac;
        }

        .pwd-rule.fail .rule-dot {
          background: #f8fafc; border: 1.5px solid #e2e8f0;
        }

        /* Submit btn */
        .btn-submit {
          width: 100%;
          background: #7C3AED; color: white;
          border: none; border-radius: 10px;
          padding: 13px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
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
          opacity: 0.7; cursor: not-allowed; transform: none;
        }

        /* Bottom link */
        .rp-bottom {
          text-align: center;
          font-size: 14px; color: #64748b;
        }
        .rp-bottom a {
          color: #7C3AED; font-weight: 600; text-decoration: none;
        }
        .rp-bottom a:hover { text-decoration: underline; }

        /* Loading skeleton */
        .rp-loading {
          display: flex; flex-direction: column;
          gap: 12px; width: 100%;
        }
        .skeleton {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 480px) {
          .rp-title { font-size: 24px; }
          .pwd-rules { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rp-wrap">
        {/* Loading skeleton while checking session */}
        {!sessionReady && !sessionError ? (
          <div className="rp-loading">
            <div
              className="skeleton"
              style={{ height: 56, width: 56, borderRadius: 14 }}
            />
            <div className="skeleton" style={{ height: 32, width: "70%" }} />
            <div className="skeleton" style={{ height: 16, width: "90%" }} />
            <div
              className="skeleton"
              style={{ height: 48, borderRadius: 10 }}
            />
            <div
              className="skeleton"
              style={{ height: 48, borderRadius: 10 }}
            />
            <div
              className="skeleton"
              style={{ height: 48, borderRadius: 10 }}
            />
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="rp-icon-wrap">
              <ShieldCheck size={26} color="#7C3AED" />
            </div>

            {/* Heading */}
            <h1 className="rp-title">Set new password</h1>
            <p className="rp-subtitle">
              Choose a strong password to secure your SahiScreen account. You'll
              be signed in automatically after resetting.
            </p>

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

            <form onSubmit={handleSubmit} noValidate>
              {/* New Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  New Password
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
                    autoFocus
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
                  Confirm New Password
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
                    placeholder="Repeat new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
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

              {/* Password rules checklist */}
              <div className="pwd-rules">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`pwd-rule ${rule.pass ? "pass" : "fail"}`}
                  >
                    <span className="rule-dot">
                      {rule.pass && (
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {rule.label}
                  </div>
                ))}
              </div>

              {/* Submit */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Updating password..." : "Update Password →"}
              </button>
            </form>

            <p className="rp-bottom">
              Remember your password? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setErrors({
        general: err.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          .sent-wrap {
            font-family: 'Plus Jakarta Sans', sans-serif;
            width: 100%;
            text-align: center;
          }

          .sent-icon-ring {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border: 2px solid #bbf7d0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          @keyframes pop-in {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          .sent-title {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.6px;
            margin-bottom: 10px;
            line-height: 1.2;
          }

          .sent-desc {
            font-size: 15px;
            color: #64748b;
            line-height: 1.7;
            margin-bottom: 28px;
          }

          .sent-desc strong {
            color: #0f172a;
            font-weight: 600;
          }

          .sent-email-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #f3f0ff;
            border: 1px solid #ddd6fe;
            border-radius: 10px;
            padding: 10px 18px;
            font-size: 14px;
            font-weight: 600;
            color: #7C3AED;
            margin-bottom: 28px;
          }

          .sent-steps {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 20px 24px;
            margin-bottom: 28px;
            text-align: left;
          }

          .sent-steps-title {
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 14px;
          }

          .sent-step-row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
          }

          .sent-step-row:last-child { margin-bottom: 0; }

          .sent-step-num {
            width: 22px;
            height: 22px;
            background: #7C3AED;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 1px;
          }

          .sent-step-text {
            font-size: 13px;
            color: #475569;
            line-height: 1.55;
            font-weight: 500;
          }

          .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #7C3AED;
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: none;
            transition: gap 0.2s ease;
            padding: 0;
          }

          .btn-back:hover { gap: 10px; }

          .resend-note {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 16px;
          }

          .resend-note button {
            background: none;
            border: none;
            color: #7C3AED;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 13px;
            padding: 0;
            text-decoration: underline;
          }
        `}</style>

        <div className="sent-wrap">
          <div className="sent-icon-ring">
            <CheckCircle2 size={38} color="#10b981" />
          </div>

          <h2 className="sent-title">Check your inbox!</h2>
          <p className="sent-desc">We've sent a password reset link to:</p>

          <div className="sent-email-chip">
            <Mail size={15} />
            {email}
          </div>

          {/* Steps */}
          <div className="sent-steps">
            <p className="sent-steps-title">What to do next</p>

            <div className="sent-step-row">
              <div className="sent-step-num">1</div>
              <p className="sent-step-text">
                Open the email from <strong>SahiScreen</strong> in your inbox
              </p>
            </div>
            <div className="sent-step-row">
              <div className="sent-step-num">2</div>
              <p className="sent-step-text">
                Click the <strong>"Reset Password"</strong> button in the email
              </p>
            </div>
            <div className="sent-step-row">
              <div className="sent-step-num">3</div>
              <p className="sent-step-text">
                Create a new strong password and sign in
              </p>
            </div>
          </div>

          <Link href="/login" className="btn-back">
            <ArrowLeft size={15} />
            Back to Sign In
          </Link>

          <p className="resend-note">
            Didn't receive it?{" "}
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Try again
            </button>{" "}
            or check your spam folder.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .fp-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
        }

        /* Back link */
        .fp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.2s ease;
          padding: 6px 0;
        }

        .fp-back:hover { color: #7C3AED; }

        /* Icon header */
        .fp-icon-wrap {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #f3f0ff, #ede9fe);
          border: 1.5px solid #ddd6fe;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .fp-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.8px;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .fp-subtitle {
          font-size: 14px;
          color: #64748b;
          font-weight: 400;
          line-height: 1.65;
          margin-bottom: 28px;
          max-width: 360px;
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
        }

        /* Form */
        .form-group { margin-bottom: 20px; }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .input-wrap { position: relative; }

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

        .field-error {
          font-size: 12px;
          font-weight: 500;
          color: #ef4444;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Info note */
        .fp-info-note {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }

        .fp-info-note svg {
          color: #7C3AED;
          flex-shrink: 0;
          margin-top: 1px;
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

        /* Bottom links */
        .fp-bottom {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          color: #64748b;
        }

        .fp-bottom a {
          color: #7C3AED;
          font-weight: 600;
          text-decoration: none;
        }

        .fp-bottom a:hover { text-decoration: underline; }

        .fp-bottom-sep {
          width: 3px;
          height: 3px;
          background: #cbd5e1;
          border-radius: 50%;
        }

        @media (max-width: 480px) {
          .fp-title { font-size: 24px; }
        }
      `}</style>

      <div className="fp-wrap">
        {/* Back link */}
        <Link href="/login" className="fp-back">
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>

        {/* Icon */}
        <div className="fp-icon-wrap">
          <Mail size={26} color="#7C3AED" />
        </div>

        {/* Heading */}
        <h1 className="fp-title">Forgot your password?</h1>
        <p className="fp-subtitle">
          No worries — enter your work email and we'll send you a secure link to
          reset your password.
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

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Work Email Address
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <p className="field-error">⚠ {errors.email}</p>}
          </div>

          {/* Info note */}
          <div className="fp-info-note">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
            <p>
              {" "}
              The reset link expires in <strong>&nbsp;60 minutes</strong>. If
              you don't see the email, check your spam folder.
            </p>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Sending reset link..." : "Send Reset Link →"}
          </button>
        </form>

        {/* Bottom links */}
        <div className="fp-bottom">
          <Link href="/login">Sign In</Link>
          <span className="fp-bottom-sep" />
          <Link href="/register">Create Account</Link>
        </div>
      </div>
    </>
  );
}

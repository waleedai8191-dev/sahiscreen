"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const plan = searchParams.get("plan") ?? "free";

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullCode = newOtp.join("");
      if (fullCode.length === 4) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      if (i < 4) newOtp[i] = digit;
    });
    setOtp(newOtp);
    // Focus last filled input
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
    // Auto-submit if 4 digits pasted
    if (pasted.length === 4) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code ?? otp.join("");
    if (finalCode.length !== 4) {
      setError("Please enter all 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: finalCode, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code. Please try again.");
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      // We need email + password — get from sessionStorage
      const savedPassword = sessionStorage.getItem("reg_pwd");
      const savedEmail = email;

      if (savedPassword) {
        const { createSupabaseBrowserClient } =
          await import("@/lib/supabase/client");
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signInWithPassword({
          email: savedEmail,
          password: savedPassword,
        });
        sessionStorage.removeItem("reg_pwd");
      }

      setTimeout(() => {
        if (data.requiresPayment) {
          router.replace(`/welcome?plan=${data.planTier}&mustPay=true`);
        } else {
          router.replace(`/welcome?plan=${data.planTier}`);
        }
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      if (res.ok) {
        setResendCooldown(60);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const otpFilled = otp.every((d) => d !== "");
  const maskedEmail = email
    ? email.replace(
        /(.{2})(.*)(@.*)/,
        (_, a, b, c) => a + "*".repeat(b.length) + c,
      )
    : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .verify-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%;
          text-align: center;
          padding: 8px 0;
        }

        /* Icon */
        .verify-icon-wrap {
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(91,33,182,0.08));
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        /* Heading */
        .verify-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.6px;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .verify-sub {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .verify-sub strong {
          color: #0f172a;
          font-weight: 600;
        }

        /* OTP inputs */
        .otp-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 28px;
        }

        .otp-input {
          width: 52px;
          height: 60px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          outline: none;
          transition: all 0.2s ease;
          caret-color: #7c3aed;
        }
        .otp-input:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
          transform: translateY(-2px);
        }
        .otp-input.filled {
          border-color: #7c3aed;
          background: linear-gradient(135deg, #f3f0ff, #faf5ff);
          color: #5b21b6;
        }
        .otp-input.error-input {
          border-color: #fca5a5;
          background: #fff5f5;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* Error */
        .error-msg {
          font-size: 13px;
          font-weight: 500;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Verify button */
        .btn-verify {
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
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
        .btn-verify:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(124,58,237,0.45);
        }
        .btn-verify:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Success state */
        .success-icon-wrap {
          width: 68px;
          height: 68px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Resend */
        .resend-row {
          font-size: 13px;
          color: #94a3b8;
        }
        .btn-resend {
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #7c3aed;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }
        .btn-resend:hover:not(:disabled) { color: #5b21b6; }
        .btn-resend:disabled {
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* Expiry note */
        .expiry-note {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 16px;
        }

        @media (max-width: 400px) {
          .otp-input {
            width: 44px;
            height: 52px;
            font-size: 20px;
          }
          .otp-grid { gap: 8px; }
        }
      `}</style>

      <div className="verify-wrap">
        {success ? (
          <>
            <div className="success-icon-wrap">
              <CheckCircle2 size={36} color="#10b981" />
            </div>
            <h2 className="verify-title">Email verified!</h2>
            <p className="verify-sub">Setting up your workspace…</p>
          </>
        ) : (
          <>
            {/* Icon */}
            <div className="verify-icon-wrap">
              <Mail size={28} color="#7c3aed" />
            </div>

            {/* Heading */}
            <h2 className="verify-title">Check your email</h2>
            <p className="verify-sub">
              We sent a 4-digit code to{" "}
              <strong>{maskedEmail || "your email"}</strong>.<br />
              Enter it below to verify your account.
            </p>

            {/* OTP inputs */}
            <div className="otp-grid" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className={`otp-input ${digit ? "filled" : ""} ${error ? "error-input" : ""}`}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading || success}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="error-msg">
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
                {error}
              </div>
            )}

            {/* Verify button */}
            <button
              className="btn-verify"
              onClick={() => handleVerify()}
              disabled={!otpFilled || loading}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Verifying…" : "Verify Email →"}
            </button>

            {/* Resend */}
            <p className="resend-row">
              Didn't receive it?{" "}
              <button
                className="btn-resend"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
              >
                {resending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </p>

            <p className="expiry-note">Code expires in 10 minutes</p>
          </>
        )}
      </div>
    </>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update company name via API route
      const res = await fetch("/api/auth/update-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to update company");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: "0 20px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 8,
        }}
      >
        One last thing 👋
      </h1>
      <p style={{ color: "#64748b", marginBottom: 32 }}>
        What company are you screening CVs for?
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Building2
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Acme Pakistan"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setError("");
            }}
            style={{
              width: "100%",
              padding: "11px 14px 11px 38px",
              border: `1.5px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              background: "#f8fafc",
            }}
          />
        </div>
        {error && (
          <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>
            ⚠ {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "#7C3AED",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "13px 24px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? <Loader2 size={16} /> : "Go to Dashboard →"}
        </button>
      </form>
    </div>
  );
}

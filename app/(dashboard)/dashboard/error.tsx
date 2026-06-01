"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard] Page-level error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: "rgba(239,68,68,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertCircle size={24} color="#ef4444" />
      </div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
        Dashboard failed to load
      </div>
      <div style={{ fontSize: "13px", color: "#64748b" }}>
        A temporary error occurred. Your data is safe.
      </div>
      <button
        onClick={reset}
        style={{
          padding: "9px 20px",
          background: "linear-gradient(135deg,#7C3AED,#5b21b6)",
          border: "none",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 700,
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Zap,
  Clock,
  Mail,
  Share2,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";

// ─── Confetti particle ────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: "rect" | "circle" | "line";
  opacity: number;
  delay: number;
}

const COLORS = [
  "#2563EB",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#a78bfa",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 3 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    shape: (["rect", "circle", "line"] as const)[Math.floor(Math.random() * 3)],
    opacity: 1,
    delay: Math.random() * 0.8,
  }));
}

// ─── Confetti Canvas ──────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>(generateParticles(90));
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.current.forEach((p) => {
        if (elapsed < p.delay) return;
        alive = true;

        const t = elapsed - p.delay;
        const x = (p.x / 100) * canvas.width + p.vx * t * 40;
        const y = p.vy * t * 60;
        const rot = p.rotation + p.rotationSpeed * t * 10;
        const fade = Math.max(0, 1 - (y / canvas.height) * 1.2);

        if (y > canvas.height || fade <= 0) return;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.translate(x, y);
        ctx.rotate((rot * Math.PI) / 180);

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, 0);
          ctx.lineTo(p.size / 2, 0);
          ctx.stroke();
        }
        ctx.restore();
      });

      if (alive) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
    />
  );
}

// ─── Timeline step ────────────────────────────────────────────────────────────
function TimelineStep({
  num,
  title,
  desc,
  delay,
}: {
  num: string;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        animation: `fadeUp 0.5s ${delay} cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-white/50 text-xs font-bold mt-0.5">
        {num}
      </div>
      <div>
        <p className="text-white/80 text-sm font-semibold">{title}</p>
        <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "There";
  const firstName = name.split(" ")[0];

  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const applyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/apply/${slug}`
      : "";

  // Stop confetti after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Job Application",
          text: "I just applied for this job via SahiScreen!",
          url: applyUrl,
        })
        .catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1C2E] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Bg glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            animation: "pulse 3s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #2563EB 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Card */}
      <div className="relative z-20 w-full max-w-md space-y-5">
        {/* ── Check icon + heading ── */}
        <div
          className="flex flex-col items-center text-center space-y-4"
          style={{ animation: "scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* Animated ring */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
            </div>
            {/* Orbiting dot */}
            <div
              className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-400"
              style={{ animation: "orbit 2s linear infinite" }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              You're in, {firstName}! 🎉
            </h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed max-w-sm">
              Your application has been received and is now being reviewed.
              We'll be in touch!
            </p>
          </div>
        </div>

        {/* ── AI Screening notice ── */}
        <div
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3"
          style={{
            animation: "fadeUp 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-semibold">
              AI Screening Underway
            </p>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
              Your CV is being analysed by SahiScreen AI. The hiring team will
              receive your score and profile shortly.
            </p>
          </div>
        </div>

        {/* ── What happens next ── */}
        <div
          className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
          style={{
            animation: "fadeUp 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
            What happens next
          </p>
          <div className="space-y-4">
            <TimelineStep
              num="1"
              title="AI reviews your CV"
              desc="SahiScreen scores your profile against the job requirements within 60 seconds."
              delay="0.35s"
            />
            <div
              className="ml-3.5 w-px h-4 bg-white/10"
              style={{ animation: "fadeUp 0.3s 0.45s both" }}
            />
            <TimelineStep
              num="2"
              title="HR team reviews"
              desc="The hiring team sees your ranked profile and AI analysis on their dashboard."
              delay="0.45s"
            />
            <div
              className="ml-3.5 w-px h-4 bg-white/10"
              style={{ animation: "fadeUp 0.3s 0.55s both" }}
            />
            <TimelineStep
              num="3"
              title="You'll hear back"
              desc="If shortlisted, the company will reach out directly via the email you provided."
              delay="0.55s"
            />
          </div>
        </div>

        {/* ── Email reminder ── */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 bg-white/4 border border-white/8 rounded-xl"
          style={{
            animation: "fadeUp 0.5s 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
          <p className="text-white/40 text-xs">
            Check your inbox for a confirmation. If you don't see it, check your
            spam folder.
          </p>
        </div>

        {/* ── Share / copy link ── */}
        <div
          className="space-y-2"
          style={{
            animation: "fadeUp 0.5s 0.7s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <p className="text-white/30 text-xs text-center">
            Know someone else who'd be a good fit?
          </p>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/12 hover:text-white/80 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Link
                </>
              )}
            </button>
            <button
              onClick={shareNative}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/12 hover:text-white/80 transition-all"
            >
              <Share2 className="w-4 h-4" /> Share Job
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-center gap-2 pt-2"
          style={{
            animation: "fadeUp 0.5s 0.8s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#1B3A5C] to-[#2563EB] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/25 text-xs">Powered by</span>
            <span className="text-white/40 text-xs font-semibold">
              SahiScreen
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0.3;
          }
        }
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(40px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(40px) rotate(-360deg);
          }
        }
        .bg-white\/4 {
          background-color: rgba(255, 255, 255, 0.04);
        }
        .bg-white\/8 {
          background-color: rgba(255, 255, 255, 0.08);
        }
        .bg-white\/12 {
          background-color: rgba(255, 255, 255, 0.12);
        }
        .border-white\/8 {
          border-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

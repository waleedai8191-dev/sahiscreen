export type PlanTier = "free" | "essential" | "premium";

export type Plan = {
  tier: PlanTier;
  name: string;
  price: number; // PKR, 0 for free
  cvLimit: number;
  jobLimit: number;
  aiEngine: string;
  antiAiDetection: boolean;
  support: string;
  features: string[];
};

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    cvLimit: 10,
    jobLimit: 1,
    aiEngine: "Basic AI",
    antiAiDetection: false,
    support: "Community",
    features: [
      "10 CVs Screened / Month",
      "Basic AI Screening",
      "1 Active Job",
      "Community Support",
    ],
  },
  essential: {
    tier: "essential",
    name: "Essential",
    price: 14999,
    cvLimit: 1000,
    jobLimit: 5,
    aiEngine: "Gemini Pro",
    antiAiDetection: false,
    support: "Email",
    features: [
      "1,000 CVs Screened / Month",
      "Gemini Pro AI Engine",
      "Ranking & Justification",
      "5 Active Jobs",
      "Email Support",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    price: 22999,
    cvLimit: 2000,
    jobLimit: 10,
    aiEngine: "Claude 3.5 Sonnet",
    antiAiDetection: true,
    support: "24/7 Priority",
    features: [
      "2,000 CVs Screened / Month",
      "Claude 3.5 Sonnet Engine",
      "Anti-AI Gaming Detection",
      "10 Active Jobs",
      "24/7 Priority Support",
    ],
  },
};

// Helper — get plan from tier string safely
export function getPlan(tier: string): Plan {
  return PLANS[tier as PlanTier] ?? PLANS.free;
}

// Helper — check if plan is paid
export function isPaidPlan(tier: PlanTier): boolean {
  return tier === "essential" || tier === "premium";
}

// Helper — check if upgrade is available
export function canUpgradeTo(current: PlanTier, target: PlanTier): boolean {
  const order: PlanTier[] = ["free", "essential", "premium"];
  return order.indexOf(target) > order.indexOf(current);
}

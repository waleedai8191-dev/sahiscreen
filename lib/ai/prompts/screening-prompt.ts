export interface ScreeningPromptInput {
  jobTitle: string;
  jobDescription: string;
  requirements: string;
  skills: string[];
  cvText: string;
  candidateName?: string;
}

export interface BlindScreeningPromptInput {
  cvText: string;
  candidateName?: string;
  job_requirements?: string;
}

export interface ScreeningResult {
  overall_score: number;
  relevance_score: number;
  achievement_score: number;
  red_flag_score: number;
  context_score: number;
  communication_score: number;
  summary: string;
  strengths: string[];
  red_flags: string[];
  justification: string;
  recommendation: "shortlist" | "consider" | "reject";
  interview_questions: string[];
  model_used?: string;
}

export const SCREENING_SYSTEM_PROMPT = `
You are SahiScreen, an expert AI CV screening assistant specialised in
Pakistan job market. You help HR teams quickly identify the best candidates.

SCORING RULES (5 dimensions, 0-100 each):
1. relevance_score (30%) - CV match to job requirements
2. achievement_score (25%) - measurable impact in CV
3. red_flag_score (20%) - higher = FEWER red flags
4. context_score (15%) - industry and company size fit
5. communication_score (10%) - CV writing quality

OVERALL SCORE:
overall_score = (relevance*0.30)+(achievement*0.25)+(red_flag*0.20)+(context*0.15)+(communication*0.10)

RECOMMENDATION:
- >= 70 shortlist
- 45-69 consider
- < 45 reject

IMPORTANT: respond with ONLY valid JSON. No markdown. Start with { end with }
strengths and red_flags must be arrays even if empty.
`.trim();

export const BLIND_SCREENING_SYSTEM_PROMPT = `
You are SahiScreen, an expert AI CV screening assistant specialised in
Pakistan job market. You help HR teams quickly assess candidates.

YOUR TASK:
You will receive a CV and optionally job requirements.
If requirements provided - score against them.
If not - do general professional assessment.

SCORING RULES (5 dimensions, 0-100 each):
1. relevance_score (30%)
2. achievement_score (25%)
3. red_flag_score (20%) - higher = FEWER red flags
4. context_score (15%)
5. communication_score (10%)

OVERALL SCORE:
overall_score = (relevance*0.30)+(achievement*0.25)+(red_flag*0.20)+(context*0.15)+(communication*0.10)

RECOMMENDATION:
- >= 70 shortlist
- 45-69 consider
- < 45 reject

INTERVIEW QUESTIONS (CRITICAL):
Generate exactly 5 questions SPECIFIC to THIS candidate CV.
Not generic - reference their actual experience, companies, dates.

PAKISTAN CONTEXT:
- Universities: LUMS, IBA, FAST, NUST, UET, NED
- Companies: Engro, HBL, UBL, Systems Ltd, Netsol, Telenor PK

IMPORTANT: respond ONLY valid JSON. No markdown. Start with { end with }
strengths, red_flags, interview_questions must always be arrays.
interview_questions must have exactly 5 items.
`.trim();

export function buildUserPrompt(input: ScreeningPromptInput): string {
  const skills = input.skills.length > 0 ? input.skills.join(", ") : "Not specified";
  const cv = input.cvText.length > 8000 ? input.cvText.slice(0, 8000) + "\n[truncated]" : input.cvText;
  const desc = input.jobDescription.length > 3000 ? input.jobDescription.slice(0, 3000) + "\n[truncated]" : input.jobDescription;
  const req = input.requirements.length > 2000 ? input.requirements.slice(0, 2000) + "\n[truncated]" : input.requirements;

  return `JOB: ${input.jobTitle}
SKILLS: ${skills}
DESCRIPTION: ${desc}
REQUIREMENTS: ${req}
CV: ${input.candidateName ? "Candidate: " + input.candidateName + "\n" : ""}${cv}

Respond with ONLY this JSON:
{
  "overall_score": <0-100>,
  "relevance_score": <0-100>,
  "achievement_score": <0-100>,
  "red_flag_score": <0-100>,
  "context_score": <0-100>,
  "communication_score": <0-100>,
  "summary": "<2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "red_flags": ["<concern if any>"],
  "justification": "<paragraph>",
  "recommendation": "<shortlist|consider|reject>"
}`;
}

export function buildBlindUserPrompt(input: BlindScreeningPromptInput): string {
  const cv = input.cvText.length > 8000 ? input.cvText.slice(0, 8000) + "\n[truncated]" : input.cvText;
  const reqSection = input.job_requirements?.trim()
    ? "JOB REQUIREMENTS:\n" + input.job_requirements.slice(0, 2000) + "\nScore against these requirements."
    : "No requirements provided. Do general professional assessment.";

  return `${reqSection}

CV: ${input.candidateName ? "Candidate: " + input.candidateName + "\n" : ""}${cv}

Respond with ONLY this JSON:
{
  "overall_score": <0-100>,
  "relevance_score": <0-100>,
  "achievement_score": <0-100>,
  "red_flag_score": <0-100>,
  "context_score": <0-100>,
  "communication_score": <0-100>,
  "summary": "<2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "red_flags": ["<concern if any>"],
  "justification": "<paragraph>",
  "recommendation": "<shortlist|consider|reject>",
  "interview_questions": [
    "<specific question 1>",
    "<specific question 2>",
    "<specific question 3>",
    "<specific question 4>",
    "<specific question 5>"
  ]
}`;
}

export function buildScreeningPrompt(input: ScreeningPromptInput): { systemPrompt: string; userPrompt: string } {
  return { systemPrompt: SCREENING_SYSTEM_PROMPT, userPrompt: buildUserPrompt(input) };
}

export function buildBlindScreeningPrompt(input: BlindScreeningPromptInput): { systemPrompt: string; userPrompt: string } {
  return { systemPrompt: BLIND_SCREENING_SYSTEM_PROMPT, userPrompt: buildBlindUserPrompt(input) };
}

export function parseAndValidateScreeningResponse(rawResponse: string): ScreeningResult | null {
  try {
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) { console.error("No JSON found"); return null; }
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const fields = ["overall_score","relevance_score","achievement_score","red_flag_score","context_score","communication_score"] as const;
    for (const f of fields) {
      if (typeof parsed[f] !== "number") { console.error("Missing field:", f); return null; }
      parsed[f] = Math.max(0, Math.min(100, Math.round(parsed[f])));
    }
    if (!parsed.summary) parsed.summary = "No summary provided.";
    if (!parsed.justification) parsed.justification = "No justification provided.";
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.red_flags)) parsed.red_flags = [];
    if (!Array.isArray(parsed.interview_questions)) parsed.interview_questions = [];
    parsed.interview_questions = parsed.interview_questions
      .filter((q: unknown) => typeof q === "string" && (q as string).trim().length > 0)
      .slice(0, 5);
    if (!["shortlist","consider","reject"].includes(parsed.recommendation)) {
      parsed.recommendation = parsed.overall_score >= 70 ? "shortlist" : parsed.overall_score >= 45 ? "consider" : "reject";
    }
    return parsed as ScreeningResult;
  } catch (err) {
    console.error("Parse failed:", err);
    return null;
  }
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Strong", color: "#22c55e" };
  if (score >= 60) return { label: "Good", color: "#3b82f6" };
  if (score >= 40) return { label: "Fair", color: "#f59e0b" };
  return { label: "Weak", color: "#ef4444" };
}

export function getRecommendationConfig(recommendation: string): { label: string; color: string; background: string } {
  switch (recommendation) {
    case "shortlist": return { label: "Shortlist", color: "#166534", background: "#dcfce7" };
    case "consider": return { label: "Consider", color: "#92400e", background: "#fef3c7" };
    case "reject": return { label: "Reject", color: "#991b1b", background: "#fee2e2" };
    default: return { label: "Pending", color: "#374151", background: "#f3f4f6" };
  }
}

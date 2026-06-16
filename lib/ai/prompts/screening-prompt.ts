export interface ScreeningPromptInput {
  // Job details
  jobTitle: string;
  jobDescription: string;
  requirements: string;
  skills: string[]; // ["React", "TypeScript", "Node.js"]

  // Candidate CV
  cvText: string; // extracted plain text from PDF/DOCX
  candidateName?: string; // optional — for context only
}
export interface BlindScreeningPromptInput {
  cvText: string; // extracted plain text from PDF/DOCX
  candidateName?: string; // optional — for context only
  job_requirements?: string; // optional — what HR is looking for
}

// ─── Output type ─────────────────────────────────────────────────────────────
// What the AI MUST return — validated before saving to DB

export interface ScreeningResult {
  // Overall score (weighted average of 5 dimensions)
  overall_score: number; // 0-100

  // 5 dimension scores
  relevance_score: number; // 0-100  how well CV matches job
  achievement_score: number; // 0-100  measurable results in CV
  red_flag_score: number; // 0-100  higher = FEWER red flags
  context_score: number; // 0-100  industry/company size fit
  communication_score: number; // 0-100  CV writing quality

  // Human-readable outputs
  summary: string; // 2-3 sentence AI summary
  strengths: string[]; // top 3-5 positive points
  red_flags: string[]; // concerns (empty array if none)
  justification: string; // detailed reasoning for score

  // Final recommendation
  recommendation: "shortlist" | "consider" | "reject";
  // Interview questions tailored to this candidate
  interview_questions: string[];
  // Metadata
  model_used?: string; // "claude-sonnet" | "gemini-pro"
}

// ─── System prompt ────────────────────────────────────────────────────────────
// Sent ONCE per API call. Sets the AI's role and behavior.
// Never changes between requests — only userPrompt changes.
//
// KEY RULES in system prompt:
// 1. Force JSON-only output (no markdown, no explanation)
// 2. Define scoring criteria clearly
// 3. Set Pakistan market context (important for relevance)
// 4. Tell AI what red flags to look for

export const SCREENING_SYSTEM_PROMPT = `
You are SahiScreen, an expert AI CV screening assistant specialised in
Pakistan's job market. You help HR teams at Pakistani SMEs and enterprises
quickly identify the best candidates from a pile of CVs.

YOUR TASK:
Analyse a candidate's CV against a specific job posting and produce a
structured JSON evaluation. You are fair, objective, and consistent.

SCORING RULES:
You score candidates on 5 dimensions, each from 0 to 100:

1. relevance_score (weight: 30%)
   - How closely does the candidate's experience, skills, and education
     match the job requirements?
   - 90-100: Almost perfect match
   - 70-89:  Strong match with minor gaps
   - 50-69:  Partial match, some important gaps
   - 30-49:  Weak match, significant gaps
   - 0-29:   Poor match, wrong field or level

2. achievement_score (weight: 25%)
   - Does the CV show measurable impact, not just duties?
   - Examples of high scores: "Increased sales by 40%", "Led team of 12",
     "Reduced costs by PKR 2M"
   - Examples of low scores: "Responsible for sales", "Managed team",
     vague duties with no outcomes

3. red_flag_score (weight: 20%)
   - Higher score = FEWER red flags (inverse scoring)
   - Red flags to detect:
     * Unexplained employment gaps > 6 months
     * Job hopping (< 1 year per role, 3+ companies in 3 years)
     * Inconsistent career progression (going backwards in seniority)
     * Vague or missing dates
     * Mismatched education claims
     * Skills listed but no evidence of use
   - 90-100: No red flags at all
   - 70-89:  Minor concerns, easily explained
   - 50-69:  Noticeable red flags worth asking about
   - 30-49:  Significant concerns
   - 0-29:   Multiple serious red flags

4. context_score (weight: 15%)
   - Does the candidate's background fit this company context?
   - Consider: industry experience, company size (startup vs enterprise),
     Pakistani market knowledge if relevant, local vs international experience
   - 90-100: Perfect contextual fit
   - 50-89:  Reasonable fit with some adaptation needed
   - 0-49:   Very different context, may struggle to adapt

5. communication_score (weight: 10%)
   - How well-written and professional is the CV itself?
   - Consider: grammar, structure, clarity, formatting, length appropriate
     for experience level (1 page for fresh grad, 2-3 for senior)
   - 90-100: Exceptionally clear and professional
   - 70-89:  Good, minor issues
   - 50-69:  Average, some clarity issues
   - 0-49:   Poor writing, hard to understand

OVERALL SCORE CALCULATION:
overall_score = (relevance * 0.30) + (achievement * 0.25) +
                (red_flag * 0.20) + (context * 0.15) +
                (communication * 0.10)
Round to nearest integer.

RECOMMENDATION THRESHOLDS:
- overall_score >= 70  → "shortlist"   (strong candidate, interview them)
- overall_score 45-69  → "consider"    (borderline, HR should review manually)
- overall_score < 45   → "reject"      (poor fit, save HR's time)

PAKISTAN MARKET CONTEXT:
- Recognise local universities: LUMS, IBA, FAST, NUST, UET, NED, Aga Khan
- Recognise local companies: Engro, HBL, UBL, Systems Ltd, Netsol, Telenor PK
- Salary context: PKR amounts are valid, USD amounts indicate diaspora/remote
- Fresh graduates (0-1 yr): Focus on education, projects, internships
- Mid-level (2-5 yr): Focus on impact and progression
- Senior (5+ yr): Focus on leadership and strategic contributions

IMPORTANT RULES:
- ALWAYS respond with ONLY valid JSON. No markdown, no explanation, no
  preamble. Your entire response must start with { and end with }
- NEVER include backticks, code blocks, or the word "json" in your response
- Be consistent: the same CV against the same job should always give
  similar scores (±5 points variance acceptable)
- Be fair: do not penalise candidates for gender, age, religion, or ethnicity
- If the CV text is too short or garbled to evaluate properly, give low scores
  across all dimensions and note it in justification
- strengths and red_flags must be arrays of strings, even if empty: []
`.trim();

// ─── Blind screening system prompt ───────────────────────────────────────────
// Used when HR screens CVs without a formal job posting.
// Two modes handled by same prompt — AI detects which based on input.

export const BLIND_SCREENING_SYSTEM_PROMPT = `
You are SahiScreen, an expert AI CV screening assistant specialised in
Pakistan's job market. You help HR teams quickly assess candidates.

YOUR TASK:
You will receive a CV and optionally a set of job requirements.
If job requirements are provided — score the candidate against them.
If no requirements are provided — do a general professional assessment.

SCORING RULES (same as always, 5 dimensions, 0-100 each):

1. relevance_score (weight: 30%)
   - WITH requirements: how well does CV match those requirements?
   - WITHOUT requirements: how relevant and focused is the candidate's
     career trajectory? Are they specialist or generalist?

2. achievement_score (weight: 25%)
   - Does the CV show measurable impact with numbers and outcomes?
   - High: "Increased sales by 40%", "Led team of 12"
   - Low: "Responsible for sales", vague duties

3. red_flag_score (weight: 20%)
   - Higher = FEWER red flags
   - Check: unexplained gaps, job hopping, inconsistent progression,
     vague dates, skills listed but never used, AI-generated CV patterns

4. context_score (weight: 15%)
   - WITH requirements: does background fit the context described?
   - WITHOUT requirements: does candidate show consistent industry
     focus and appropriate company-size experience?

5. communication_score (weight: 10%)
   - CV writing quality, grammar, structure, appropriate length

OVERALL SCORE:
overall_score = (relevance*0.30) + (achievement*0.25) +
                (red_flag*0.20) + (context*0.15) + (communication*0.10)
Round to nearest integer.

RECOMMENDATION:
- >= 70 → "shortlist"
- 45-69 → "consider"
- < 45  → "reject"

INTERVIEW QUESTIONS RULE (CRITICAL):
Generate exactly 5 interview questions.
These must be SPECIFIC to THIS candidate's actual CV — not generic.
Read their actual experience and ask about it directly.

Good example (specific):
"You mentioned leading a team at Systems Ltd from 2021-2023.
 How did you handle underperforming team members?"

Bad example (generic):
"Tell me about your leadership experience."

Questions should probe:
- Gaps or career changes that need explanation
- Claims that seem exaggerated or vague
- Key skills they listed — verify depth
- Biggest achievement they mentioned — get details
- Culture/context fit for Pakistani SME environment

PAKISTAN MARKET CONTEXT:
- Recognise local universities: LUMS, IBA, FAST, NUST, UET, NED, Aga Khan
- Recognise local companies: Engro, HBL, UBL, Systems Ltd, Netsol, Telenor PK
- Fresh graduates (0-1 yr): Focus on education, projects, internships
- Mid-level (2-5 yr): Focus on impact and progression
- Senior (5+ yr): Focus on leadership and strategic contributions

IMPORTANT RULES:
- ALWAYS respond with ONLY valid JSON. No markdown, no explanation.
  Your entire response must start with { and end with }
- NEVER include backticks or code blocks
- strengths, red_flags, interview_questions must always be arrays
- interview_questions must always have exactly 5 items
`.trim();

// ─── Blind user prompt builder ────────────────────────────────────────────────

export function buildBlindUserPrompt(input: BlindScreeningPromptInput): string {
  const cvTextSafe =
    input.cvText.length > 8000
      ? input.cvText.slice(0, 8000) + "\n\n[CV truncated]"
      : input.cvText;

  const requirementsSection = input.job_requirements?.trim()
    ? `═══════════════════════════════
JOB REQUIREMENTS (provided by HR)
═══════════════════════════════
${input.job_requirements.slice(0, 2000)}

Score this candidate against these requirements.`
    : `═══════════════════════════════
JOB REQUIREMENTS
═══════════════════════════════
None provided — perform a general professional assessment.
Score based on overall CV quality, career trajectory, and marketability.`;

  return `
${requirementsSection}

═══════════════════════════════
CANDIDATE CV
═══════════════════════════════
${input.candidateName ? `Candidate: ${input.candidateName}\n` : ""}
${cvTextSafe || "ERROR: No CV text could be extracted."}

═══════════════════════════════
INSTRUCTIONS
═══════════════════════════════
Evaluate this candidate. Respond with ONLY this exact JSON:

{
  "overall_score": <integer 0-100>,
  "relevance_score": <integer 0-100>,
  "achievement_score": <integer 0-100>,
  "red_flag_score": <integer 0-100>,
  "context_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "summary": "<2-3 sentences summarising this candidate for HR>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "red_flags": [
    "<concern if any, empty array if none>"
  ],
  "justification": "<detailed paragraph explaining the overall_score>",
  "recommendation": "<shortlist|consider|reject>",
  "interview_questions": [
    "<specific question 1 based on THIS candidate's CV>",
    "<specific question 2 based on THIS candidate's CV>",
    "<specific question 3 based on THIS candidate's CV>",
    "<specific question 4 based on THIS candidate's CV>",
    "<specific question 5 based on THIS candidate's CV>"
  ]
}
`.trim();
}

// ─── Blind prompt builder (main export) ──────────────────────────────────────

export function buildBlindScreeningPrompt(input: BlindScreeningPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: BLIND_SCREENING_SYSTEM_PROMPT,
    userPrompt: buildBlindUserPrompt(input),
  };
}

// ─── User prompt builder ──────────────────────────────────────────────────────
// Called once per CV. Injects job data + CV text into the prompt.
// Returns the message the AI sees as the "user" turn.

export function buildUserPrompt(input: ScreeningPromptInput): string {
  const skillsList =
    input.skills.length > 0 ? input.skills.join(", ") : "Not specified";

  // Truncate CV text if too long (Claude context limit safety)
  // 8000 chars ≈ 2000 tokens — enough for any CV
  const cvTextSafe =
    input.cvText.length > 8000
      ? input.cvText.slice(0, 8000) + "\n\n[CV truncated — text too long]"
      : input.cvText;

  // Truncate job description if too long
  const descSafe =
    input.jobDescription.length > 3000
      ? input.jobDescription.slice(0, 3000) + "\n[Description truncated]"
      : input.jobDescription;

  const reqSafe =
    input.requirements.length > 2000
      ? input.requirements.slice(0, 2000) + "\n[Requirements truncated]"
      : input.requirements;

  return `
═══════════════════════════════
JOB POSTING
═══════════════════════════════
Title:        ${input.jobTitle}
Required Skills: ${skillsList}

Description:
${descSafe || "No description provided."}

Requirements:
${reqSafe || "No requirements provided."}

═══════════════════════════════
CANDIDATE CV
═══════════════════════════════
${input.candidateName ? `Candidate: ${input.candidateName}\n` : ""}
${cvTextSafe || "ERROR: No CV text could be extracted from this file."}

═══════════════════════════════
INSTRUCTIONS
═══════════════════════════════
Evaluate this candidate for the job above.

Respond with ONLY this exact JSON structure — no other text:

{
  "overall_score": <integer 0-100>,
  "relevance_score": <integer 0-100>,
  "achievement_score": <integer 0-100>,
  "red_flag_score": <integer 0-100>,
  "context_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "summary": "<2-3 sentences summarising this candidate for HR>",
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "red_flags": [
    "<concern 1 if any>"
  ],
"recommendation": "<shortlist|consider|reject>",
  "interview_questions": [
    "<specific question 1 based on THIS candidate's CV and this job>",
    "<specific question 2 based on THIS candidate's CV and this job>",
    "<specific question 3 based on THIS candidate's CV and this job>",
    "<specific question 4 based on THIS candidate's CV and this job>",
    "<specific question 5 based on THIS candidate's CV and this job>"
  ],
  "justification": "<detailed paragraph explaining the overall_score>",
`.trim();
}

// ─── Full prompt builder ──────────────────────────────────────────────────────
// Main export. Call this from claude.ts and gemini.ts.
// Returns both prompts ready to send to any AI provider.

export function buildScreeningPrompt(input: ScreeningPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt: SCREENING_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
  };
}

// ─── Response validator ───────────────────────────────────────────────────────
// Validates and cleans AI response before saving to DB.
// AI sometimes wraps JSON in markdown — this strips it.
// Also ensures all required fields exist with correct types.

export function parseAndValidateScreeningResponse(
  rawResponse: string,
): ScreeningResult | null {
  try {
    // Strip markdown code blocks if AI forgot the rules
    // e.g. ```json { ... } ``` → { ... }
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "");
    cleaned = cleaned.replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
    cleaned = cleaned.trim();

    // Find the JSON object in case there's extra text
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON object found in AI response");
      return null;
    }

    const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);

    // Validate all required numeric fields exist
    const numericFields = [
      "overall_score",
      "relevance_score",
      "achievement_score",
      "red_flag_score",
      "context_score",
      "communication_score",
    ] as const;

    for (const field of numericFields) {
      if (typeof parsed[field] !== "number") {
        console.error(`Missing or invalid field: ${field}`);
        return null;
      }
      // Clamp to 0-100 range
      parsed[field] = Math.max(0, Math.min(100, Math.round(parsed[field])));
    }

    // Validate string fields
    if (typeof parsed.summary !== "string" || !parsed.summary) {
      parsed.summary = "No summary provided.";
    }

    if (typeof parsed.justification !== "string" || !parsed.justification) {
      parsed.justification = "No justification provided.";
    }

    // Validate arrays
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.red_flags)) parsed.red_flags = [];
    if (!Array.isArray(parsed.interview_questions)) {
      parsed.interview_questions = [];
    }
    // Ensure all items are strings
    parsed.interview_questions = parsed.interview_questions
      .filter((q: unknown) => typeof q === "string" && q.trim().length > 0)
      .slice(0, 5);

    // Validate recommendation
    const validRecs = ["shortlist", "consider", "reject"];
    if (!validRecs.includes(parsed.recommendation)) {
      // Derive from score if AI gave invalid value
      parsed.recommendation =
        parsed.overall_score >= 70
          ? "shortlist"
          : parsed.overall_score >= 45
            ? "consider"
            : "reject";
    }

    return parsed as ScreeningResult;
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    console.error("Raw response was:", rawResponse.slice(0, 500));
    return null;
  }
}

// ─── Score label helper ───────────────────────────────────────────────────────
// Converts numeric score to display label used in dashboard UI.
// Used in frontend components — imported from here for consistency.

export function getScoreLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Strong", color: "#22c55e" };
  if (score >= 60) return { label: "Good", color: "#3b82f6" };
  if (score >= 40) return { label: "Fair", color: "#f59e0b" };
  return { label: "Weak", color: "#ef4444" };
}

// ─── Recommendation label helper ─────────────────────────────────────────────
// Converts recommendation string to display config for UI badges.

export function getRecommendationConfig(recommendation: string): {
  label: string;
  color: string;
  background: string;
} {
  switch (recommendation) {
    case "shortlist":
      return { label: "Shortlist", color: "#166534", background: "#dcfce7" };
    case "consider":
      return { label: "Consider", color: "#92400e", background: "#fef3c7" };
    case "reject":
      return { label: "Reject", color: "#991b1b", background: "#fee2e2" };
    default:
      return { label: "Pending", color: "#374151", background: "#f3f4f6" };
  }
}

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { screenWithClaude } from "@/lib/ai/prompts/providers/claude";
import {
  ScreeningPromptInput,
  ScreeningResult,
} from "@/lib/ai/prompts/screening-prompt";

// ─── Input type ───────────────────────────────────────────────────────────────

export interface ScreeningEngineInput {
  cvId: string; // cv_uploads.id
  jobId: string; // jobs.id
  companyId: string; // companies.id
}

// ─── Output type ──────────────────────────────────────────────────────────────

export interface ScreeningEngineResult {
  success: boolean;
  cvId: string;
  score?: number;
  result?: ScreeningResult;
  error?: string;
  durationMs?: number; // how long screening took
}

// ─── Text extraction helper ───────────────────────────────────────────────────
// Calls the /api/extract-cv route to get plain text from PDF/DOCX.
// Returns empty string on failure — screening continues with empty CV text
// (AI will give low scores due to no content — which is correct behavior).

async function extractCVText(
  filePath: string,
  cvId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const res = await fetch(`${appUrl}/api/extract-cv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, cvId }),
    });

    if (!res.ok) {
      console.warn(`extract-cv returned ${res.status} for cvId: ${cvId}`);
      return "";
    }

    const data = await res.json();
    const text = data.text ?? "";

    // Save extracted text to cv_uploads for future use
    // Next time this CV is screened — we skip extraction
    if (text) {
      await admin
        .from("cv_uploads")
        .update({
          parsed_text: text,
          extraction_status: "completed",
        })
        .eq("id", cvId);
    }

    return text;
  } catch (err) {
    console.error(`Text extraction failed for cvId ${cvId}:`, err);
    return "";
  }
}

// ─── Save result to DB ────────────────────────────────────────────────────────
// Upserts screening result into screening_results table.
// Uses upsert (insert or update) — safe to call multiple times
// in case of retries.

async function saveScreeningResult(
  cvId: string,
  jobId: string,
  companyId: string,
  result: ScreeningResult,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<void> {
  await admin.from("screening_results").upsert(
    {
      candidate_id: cvId,
      cv_id: cvId,
      job_id: jobId,
      company_id: companyId,

      // Scores
      score: result.overall_score,
      overall_score: result.overall_score,
      relevance_score: result.relevance_score,
      achievement_score: result.achievement_score,
      red_flag_score: result.red_flag_score,
      context_score: result.context_score,
      communication_score: result.communication_score,

      // AI outputs
      summary: result.summary,
      strengths: result.strengths,
      red_flags: result.red_flags,
      justification: result.justification,
      recommendation: result.recommendation,
      interview_questions: result.interview_questions ?? [],

      // Meta
      status: "completed",
      model_used: result.model_used ?? "claude-sonnet",
      screened_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id" },
  );
}

// ─── Mark screening as failed ─────────────────────────────────────────────────
// Updates both tables when screening fails.
// HR sees "Failed" badge on candidate — can retry manually.

async function markAsFailed(
  cvId: string,
  jobId: string,
  companyId: string,
  reason: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<void> {
  // Update cv_uploads
  await admin
    .from("cv_uploads")
    .update({ screening_status: "failed" })
    .eq("id", cvId);

  // Upsert failed record in screening_results
  await admin.from("screening_results").upsert(
    {
      candidate_id: cvId,
      cv_id: cvId,
      job_id: jobId,
      company_id: companyId,
      status: "failed",
      justification: `Screening failed: ${reason}`,
      screened_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id" },
  );
}

// ─── MAIN SCREENING FUNCTION ──────────────────────────────────────────────────
// This is the only export that matters.
// Called by screen-cv/route.ts with cvId + jobId + companyId.
//
// Full flow:
// 1. Fetch CV record from cv_uploads
// 2. Fetch job from jobs table
// 3. Mark CV as "processing"
// 4. Extract CV text (or use cached parsed_text)
// 5. Build prompt input
// 6. Call Claude
// 7. Save result to screening_results
// 8. Update cv_uploads → "completed"
// 9. Increment jobs.screened_count

export async function runScreening(
  input: ScreeningEngineInput,
): Promise<ScreeningEngineResult> {
  const { cvId, jobId, companyId } = input;
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();

  console.log(`🔄 Starting screening — cvId: ${cvId}, jobId: ${jobId}`);

  // ── Step 1: Fetch CV record ──────────────────────────────────────────────

  const { data: cvRecord, error: cvErr } = await admin
    .from("cv_uploads")
    .select(
      `id,
       file_path,
       candidate_name,
       candidate_email,
       parsed_text,
       screening_status,
       company_id`,
    )
    .eq("id", cvId)
    .eq("company_id", companyId)
    .single();

  if (cvErr || !cvRecord) {
    console.error(`CV not found: ${cvId}`, cvErr);
    return {
      success: false,
      cvId,
      error: "CV record not found in database",
    };
  }

  // Skip if already completed — prevents double screening
  if (cvRecord.screening_status === "completed") {
    console.log(`CV ${cvId} already screened — skipping`);
    return {
      success: true,
      cvId,
      error: "Already screened",
    };
  }

  // ── Step 2: Fetch job details ────────────────────────────────────────────

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select(
      `id,
       title,
       description,
       requirements,
       skills,
       screened_count`,
    )
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    console.error(`Job not found: ${jobId}`, jobErr);
    await markAsFailed(cvId, jobId, companyId, "Job not found", admin);
    return {
      success: false,
      cvId,
      error: "Job not found",
    };
  }

  // ── Step 3: Mark as processing ───────────────────────────────────────────
  // Update immediately so HR sees "Processing..." in dashboard

  await admin
    .from("cv_uploads")
    .update({ screening_status: "processing" })
    .eq("id", cvId);

  // ── Step 4: Get CV text ──────────────────────────────────────────────────
  // Use cached parsed_text if available — saves extraction API call

  let cvText = cvRecord.parsed_text ?? "";

  if (!cvText && cvRecord.file_path) {
    console.log(`Extracting text for cv: ${cvId}`);
    cvText = await extractCVText(cvRecord.file_path, cvId, admin);
  }

  if (!cvText) {
    console.warn(
      `No CV text available for ${cvId} — ` + `screening will give low scores`,
    );
  }

  // ── Step 5: Build prompt input ───────────────────────────────────────────

  const promptInput: ScreeningPromptInput = {
    jobTitle: job.title,
    jobDescription: job.description ?? "",
    requirements: job.requirements ?? "",
    skills: job.skills ?? [],
    cvText,
    candidateName: cvRecord.candidate_name ?? undefined,
  };

  // ── Step 6: Call Claude ──────────────────────────────────────────────────

  let screeningResult: ScreeningResult;

  try {
    screeningResult = await screenWithClaude(promptInput);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Claude API failed";
    console.error(`Claude screening failed for cv ${cvId}:`, reason);
    await markAsFailed(cvId, jobId, companyId, reason, admin);
    return {
      success: false,
      cvId,
      error: reason,
      durationMs: Date.now() - startTime,
    };
  }

  // ── Step 7: Save result to screening_results ─────────────────────────────

  try {
    await saveScreeningResult(cvId, jobId, companyId, screeningResult, admin);
  } catch (err) {
    console.error(`Failed to save screening result for cv ${cvId}:`, err);
    await markAsFailed(
      cvId,
      jobId,
      companyId,
      "Failed to save result to database",
      admin,
    );
    return {
      success: false,
      cvId,
      error: "Database save failed",
      durationMs: Date.now() - startTime,
    };
  }

  // ── Step 8: Update cv_uploads → completed ───────────────────────────────

  await admin
    .from("cv_uploads")
    .update({ screening_status: "completed" })
    .eq("id", cvId);

  // ── Step 9: Increment jobs.screened_count ────────────────────────────────

  await admin
    .from("jobs")
    .update({
      screened_count: (job.screened_count ?? 0) + 1,
    })
    .eq("id", jobId);

  const durationMs = Date.now() - startTime;

  console.log(
    `✅ Screening complete — cvId: ${cvId}, ` +
      `score: ${screeningResult.overall_score}, ` +
      `recommendation: ${screeningResult.recommendation}, ` +
      `duration: ${durationMs}ms`,
  );

  return {
    success: true,
    cvId,
    score: screeningResult.overall_score,
    result: screeningResult,
    durationMs,
  };
}

// ─── Bulk screening helper ────────────────────────────────────────────────────
// Processes multiple CVs for a job one by one.
// Called by /api/screening/trigger when HR uploads batch of CVs.
// Sequential (not parallel) to avoid overwhelming Claude API.

export async function runBulkScreening(
  cvIds: string[],
  jobId: string,
  companyId: string,
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: ScreeningEngineResult[];
}> {
  const results: ScreeningEngineResult[] = [];
  let succeeded = 0;
  let failed = 0;

  console.log(
    `🔄 Bulk screening started — ` + `${cvIds.length} CVs for job: ${jobId}`,
  );

  for (const cvId of cvIds) {
    const result = await runScreening({ cvId, jobId, companyId });
    results.push(result);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Small delay between CVs to be respectful of API rate limits
    // 500ms gap = max 2 CVs/second = 120 CVs/minute
    // Well within Claude's rate limits
    if (cvIds.indexOf(cvId) < cvIds.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(
    `✅ Bulk screening complete — ` +
      `succeeded: ${succeeded}, failed: ${failed}`,
  );

  return {
    total: cvIds.length,
    succeeded,
    failed,
    results,
  };
}

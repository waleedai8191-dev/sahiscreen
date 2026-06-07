import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { incrementCvCount } from "@/lib/limitChecks";

export async function POST(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const body = await req.json();

    const { jobId, companyId, cvId } = body;

    if (!jobId || !companyId) {
      return NextResponse.json(
        { error: "jobId and companyId are required" },
        { status: 400 },
      );
    }

    // 1. Fetch the job description (needed for AI scoring)
    const { data: job } = await admin
      .from("jobs")
      .select("id, title, description, requirements, skills")
      .eq("id", jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Fetch pending CVs — either one specific CV or all pending for job
    let query = admin
      .from("cv_uploads")
      .select(
        "id, file_path, candidate_name, candidate_email, parsed_text, screening_status, company_id",
      )
      .eq("job_id", jobId)
      .eq("company_id", companyId);

    if (cvId) {
      // Single CV trigger (from apply route)
      query = query.eq("id", cvId);
    } else {
      // Bulk trigger (from HR upload page)
      query = query.eq("screening_status", "pending");
    }

    const { data: cvList, error: fetchErr } = await query;

    if (fetchErr || !cvList || cvList.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending CVs to process",
        processed: 0,
      });
    }

    // 3. Mark all as 'processing' immediately
    const cvIds = cvList.map((cv) => cv.id);
    await admin
      .from("cv_uploads")
      .update({ screening_status: "processing" })
      .in("id", cvIds);

    // 4. Process each CV (calls your existing extract-cv + screen-cv routes)
    // Done asynchronously — we respond immediately and process in background
    processCVsInBackground(cvList, job, admin);

    return NextResponse.json({
      success: true,
      message: `Screening triggered for ${cvList.length} CV(s)`,
      processed: cvList.length,
    });
  } catch (err) {
    console.error("POST /api/screening/trigger error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── Background processor ─────────────────────────────────────────────────────
// Runs after HTTP response is sent. Processes each CV one by one.

async function processCV(
  cv: {
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
    company_id: string;
  },
  job: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    skills?: string[];
  },
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  try {
    // Step A: Extract CV text (uses your existing /api/extract-cv)
    // Step A: Extract CV text directly — no HTTP round-trip
    let cvText = cv.parsed_text ?? "";

    if (!cvText) {
      try {
        const { data: fileData, error: downloadErr } = await admin.storage
          .from("cvs")
          .download(cv.file_path);

        if (!downloadErr && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = cv.file_path.split(".").pop()?.toLowerCase();

          if (ext === "pdf") {
            try {
              const { extractText } = await import("unpdf");
              const { text } = await extractText(new Uint8Array(buffer), {
                mergePages: true,
              });
              cvText = text ?? "";
            } catch (e) {
              console.error("PDF parse error:", e);
            }
          } else if (ext === "docx") {
            try {
              const mammoth = await import("mammoth");
              const result = await mammoth.extractRawText({ buffer });
              cvText = result.value ?? "";
            } catch (e) {
              console.error("DOCX parse error:", e);
            }
          }

          cvText = cvText
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          await admin
            .from("cv_uploads")
            .update({
              parsed_text: cvText,
              extraction_status: cvText.length > 50 ? "completed" : "failed",
            })
            .eq("id", cv.id);

          console.log(`Extracted ${cvText.length} chars from ${cv.file_path}`);
        }
      } catch (extractErr) {
        console.error("Extraction error:", extractErr);
      }
    }
    // Step B: Call Claude directly
    const { buildScreeningPrompt, parseAndValidateScreeningResponse } =
      await import("@/lib/ai/prompts/screening-prompt");
    const { systemPrompt, userPrompt } = buildScreeningPrompt({
      jobTitle: job.title,
      jobDescription: job.description ?? "",
      requirements: job.requirements ?? "",
      skills: job.skills ?? [],
      cvText,
      candidateName: cv.candidate_name,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude API error ${claudeRes.status}: ${err}`);
    }

    const claudeData = await claudeRes.json();
    const rawResponse = claudeData.content?.[0]?.text ?? "";
    const result = parseAndValidateScreeningResponse(rawResponse);

    if (!result) {
      throw new Error(`Invalid AI response: ${rawResponse.slice(0, 200)}`);
    }

    // Step C: Save to screening_results
    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id,
        cv_id: cv.id,
        job_id: job.id,
        company_id: cv.company_id,
        score: result.overall_score,
        overall_score: result.overall_score,
        relevance_score: result.relevance_score,
        achievement_score: result.achievement_score,
        red_flag_score: result.red_flag_score,
        context_score: result.context_score,
        communication_score: result.communication_score,
        summary: result.summary,
        strengths: result.strengths,
        red_flags: result.red_flags,
        justification: result.justification,
        recommendation: result.recommendation,
        status: "completed",
        model_used: "claude-haiku-4-5",
        screened_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id" },
    );

    if (!result) {
      throw new Error(`Invalid AI response: ${rawResponse.slice(0, 200)}`);
    }

    // Step C: Save to screening_results
    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id,
        cv_id: cv.id,
        job_id: job.id,
        company_id: cv.company_id,
        score: result.overall_score,
        overall_score: result.overall_score,
        relevance_score: result.relevance_score,
        achievement_score: result.achievement_score,
        red_flag_score: result.red_flag_score,
        context_score: result.context_score,
        communication_score: result.communication_score,
        summary: result.summary,
        strengths: result.strengths,
        red_flags: result.red_flags,
        justification: result.justification,
        recommendation: result.recommendation,
        status: "completed",
        model_used: "claude-haiku-4-5",
        screened_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id" },
    );
    // Step D: Update cv_uploads screening_status to completed
    await admin
      .from("cv_uploads")
      .update({ screening_status: "completed" })
      .eq("id", cv.id);

    // Step E: Increment job screened_count
    const { data: jobRow } = await admin
      .from("jobs")
      .select("screened_count")
      .eq("id", job.id)
      .single();

    if (jobRow) {
      await admin
        .from("jobs")
        .update({ screened_count: (jobRow.screened_count ?? 0) + 1 })
        .eq("id", job.id);
    }
    await incrementCvCount(cv.company_id, 1);
  } catch (err) {
    console.error(`screening failed for cv ${cv.id}:`, err);

    // Mark as failed so HR can see it in dashboard
    await admin
      .from("cv_uploads")
      .update({ screening_status: "failed" })
      .eq("id", cv.id);

    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id,
        cv_id: cv.id,
        job_id: job.id,
        status: "failed",
        screened_at: new Date().toISOString(),
      },
      {
        onConflict: "candidate_id",
      },
    );
  }
}

async function processCVsInBackground(
  cvList: Array<{
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
    company_id: string;
  }>,
  job: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    skills?: string[];
  },
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  for (const cv of cvList) {
    await processCV(cv, job, admin);
  }
}

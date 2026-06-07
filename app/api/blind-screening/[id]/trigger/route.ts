import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { incrementCvCount } from "@/lib/limitChecks";
import {
  buildBlindScreeningPrompt,
  parseAndValidateScreeningResponse,
  BlindScreeningPromptInput,
} from "@/lib/ai/prompts/screening-prompt";

// ─── Config ───────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// ─── AI provider selector ─────────────────────────────────────────────────────
// Main concept:
// Free plan   → Claude (trial — same model, limited CVs)
// Essential   → Gemini Pro (cost-effective for high volume)
// Premium     → Claude (full quality)
//
// This is the single place that enforces the client's AI engine requirement.

async function getAIProvider(
  companyId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<"claude-haiku" | "gemini" | "claude-sonnet"> {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_tier")
    .eq("company_id", companyId)
    .single();

  const plan = sub?.plan_tier ?? "free";

  if (plan === "essential") return "gemini"; // Essential → Gemini Pro
  if (plan === "premium") return "claude-sonnet"; // Premium   → Claude Sonnet
  return "claude-haiku"; // Free      → Claude Haiku
}

// ─── Call Claude ──────────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  model: "claude-haiku" | "claude-sonnet" = "claude-haiku",
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  // Map internal name to actual API model string
  const modelString =
    model === "claude-sonnet"
      ? "claude-sonnet-4-5"
      : "claude-haiku-4-5-20251001";

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelString,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

// ─── Call Gemini ──────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // Auth check
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch session — includes job_requirements
    const { data: session } = await admin
      .from("blind_screenings")
      .select("id, name, job_requirements, status")
      .eq("id", sessionId)
      .eq("company_id", profile.company_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "archived") {
      return NextResponse.json(
        { error: "Cannot screen an archived session" },
        { status: 400 },
      );
    }

    // Fetch pending CVs for this session
    const { data: cvList, error: fetchErr } = await admin
      .from("cv_uploads")
      .select("id, file_path, candidate_name, parsed_text, company_id")
      .eq("blind_screening_id", sessionId)
      .eq("company_id", profile.company_id)
      .eq("screening_status", "pending");

    if (fetchErr || !cvList || cvList.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending CVs to process",
        processed: 0,
      });
    }

    // Mark all as processing immediately so HR sees status update
    const cvIds = cvList.map((cv) => cv.id);
    await admin
      .from("cv_uploads")
      .update({ screening_status: "processing" })
      .in("id", cvIds);

    // Determine AI provider once for whole session
    const aiProvider = await getAIProvider(profile.company_id, admin);

    // Respond immediately — process in background
    await processBlindCVsInBackground(
      cvList,
      session.job_requirements ?? null,
      sessionId,
      profile.company_id,
      aiProvider,
      admin,
    );

    return NextResponse.json({
      success: true,
      message: `Screening triggered for ${cvList.length} CV(s)`,
      processed: cvList.length,
      ai_provider: aiProvider,
      mode: session.job_requirements ? "requirements_based" : "general",
    });
  } catch (err) {
    console.error("POST /api/blind-screening/[id]/trigger error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── Process single CV ────────────────────────────────────────────────────────

async function processBlindCV(
  cv: {
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
    company_id: string;
  },
  jobRequirements: string | null,
  sessionId: string,
  companyId: string,
  aiProvider: "claude-haiku" | "gemini" | "claude-sonnet",

  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  try {
    console.log("🔵 START processing cv:", cv.id, cv.candidate_name);
    // const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Step A: Get CV text — extract directly (no HTTP round-trip)
    let cvText =
      cv.parsed_text && cv.parsed_text.length > 50 ? cv.parsed_text : "";

    if (!cvText) {
      try {
        // Download file directly from Supabase Storage
        const { data: fileData, error: downloadErr } = await admin.storage
          .from("cvs")
          .download(cv.file_path);

        if (!downloadErr && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Detect file type from path
          const ext = cv.file_path.split(".").pop()?.toLowerCase();
          if (ext === "pdf") {
            try {
              console.log(
                "📄 Starting PDF extraction, buffer size:",
                buffer.length,
              );
              const { extractText } = await import("unpdf");
              const { text } = await extractText(new Uint8Array(buffer), {
                mergePages: true,
              });
              cvText = text ?? "";
              console.log("📄 Extracted text length:", cvText.length);
              console.log("📄 First 200 chars:", cvText.slice(0, 200));
            } catch (pdfErr) {
              console.error("PDF parse error:", pdfErr);
            }
          }

          // Clean the text
          cvText = cvText
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/ {3,}/g, "  ")
            .trim();

          // Cache it
          await admin
            .from("cv_uploads")
            .update({
              parsed_text: cvText,
              extraction_status: cvText.length > 50 ? "completed" : "failed",
            })
            .eq("id", cv.id);

          console.log(`Extracted ${cvText.length} chars from ${cv.file_path}`);
        } else {
          console.error("Storage download failed:", downloadErr);
        }
      } catch (extractErr) {
        console.error("Extraction error:", extractErr);
      }
    }

    // Step B: Build blind prompt
    // job_requirements present → score against them
    // job_requirements null   → general assessment
    const promptInput: BlindScreeningPromptInput = {
      cvText,
      candidateName: cv.candidate_name,
      job_requirements: jobRequirements ?? undefined,
    };

    const { systemPrompt, userPrompt } = buildBlindScreeningPrompt(promptInput);

    // Step C: Call AI based on plan
    let rawResponse = "";
    console.log("🤖 Calling AI provider:", aiProvider);
    if (aiProvider === "gemini") {
      rawResponse = await callGemini(systemPrompt, userPrompt);
    } else if (aiProvider === "claude-sonnet") {
      rawResponse = await callClaude(systemPrompt, userPrompt, "claude-sonnet");
    } else {
      rawResponse = await callClaude(systemPrompt, userPrompt, "claude-haiku");
    }
    console.log("🤖 Raw AI response length:", rawResponse.length);
    console.log("🤖 Raw AI response preview:", rawResponse.slice(0, 300));

    // Step D: Parse and validate AI response
    const result = parseAndValidateScreeningResponse(rawResponse);
    console.log("📊 Parsed result:", result ? "SUCCESS" : "FAILED");
    console.log("📊 Result preview:", JSON.stringify(result)?.slice(0, 200));

    if (!result) {
      throw new Error(
        `AI returned invalid response. Raw: ${rawResponse.slice(0, 200)}`,
      );
    }

    const { data: upsertData, error: upsertError } = await admin
      .from("screening_results")
      .upsert(
        {
          candidate_id: cv.id,
          cv_id: cv.id,
          job_id: null,
          company_id: companyId,
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
          interview_questions: result.interview_questions ?? [],
          status: "completed",
          model_used:
            aiProvider === "gemini"
              ? "gemini-pro"
              : aiProvider === "claude-sonnet"
                ? "claude-sonnet-4-5"
                : "claude-haiku-4-5",
          screened_at: new Date().toISOString(),
        },
        { onConflict: "candidate_id" },
      );

    console.log("💾 Upsert error:", JSON.stringify(upsertError));
    console.log("💾 Upsert data:", JSON.stringify(upsertData));

    if (upsertError) {
      throw new Error(
        `Upsert failed: ${upsertError.message} | Code: ${upsertError.code} | Details: ${upsertError.details} | Hint: ${upsertError.hint}`,
      );
    }

    // Step F: Mark CV as completed
    await admin
      .from("cv_uploads")
      .update({ screening_status: "completed" })
      .eq("id", cv.id);

    // Step G: Increment subscription CV count
    // Only on success — user never loses quota for failed screening
    await incrementCvCount(companyId, 1);

    console.log(
      `✅ Blind screening complete — cv: ${cv.id}, ` +
        `score: ${result.overall_score}, provider: ${aiProvider}`,
    );
  } catch (err) {
    console.error(`❌ FAILED for cv ${cv.id}:`, err);
    console.error(`❌ Full error:`, JSON.stringify(err));

    await admin
      .from("cv_uploads")
      .update({ screening_status: "failed" })
      .eq("id", cv.id);

    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id,
        cv_id: cv.id,
        job_id: null,
        company_id: companyId,
        status: "failed",
        screened_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id" },
    );
  }
}

// ─── Process all CVs in background ───────────────────────────────────────────

async function processBlindCVsInBackground(
  cvList: Array<{
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
    company_id: string;
  }>,
  jobRequirements: string | null,
  sessionId: string,
  companyId: string,
  aiProvider: "claude-haiku" | "gemini" | "claude-sonnet",
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  for (const cv of cvList) {
    await processBlindCV(
      cv,
      jobRequirements,
      sessionId,
      companyId,
      aiProvider,
      admin,
    );
  }
}

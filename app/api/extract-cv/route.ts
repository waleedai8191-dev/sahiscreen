import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Text cleaning helper ─────────────────────────────────────────────────────
// Cleans extracted text before sending to Claude.
// Removes excessive whitespace, special chars, and garbled content.
//
// Why clean? Raw PDF text often has:
//   "J o h n    S m i t h" (spaced characters)
//   "\x00\x01\x02" (binary garbage)
//   "                    " (massive whitespace blocks)

function cleanExtractedText(raw: string): string {
  return (
    raw
      // Remove null bytes and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Collapse 3+ consecutive newlines to 2
      .replace(/\n{3,}/g, "\n\n")
      // Collapse excessive spaces (but keep single spaces)
      .replace(/ {3,}/g, "  ")
      // Remove lines that are just special characters/symbols
      .split("\n")
      .filter((line) => {
        const cleaned = line.trim();
        // Keep line if it has at least 2 actual letters/numbers
        return (
          cleaned.length === 0 ||
          (cleaned.match(/[a-zA-Z0-9]/g) ?? []).length >= 2
        );
      })
      .join("\n")
      .trim()
  );
}

// ─── PDF extraction ───────────────────────────────────────────────────────────
// Uses pdf-parse to extract text from PDF buffer.
// Returns empty string on failure — never throws.

async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import — pdf-parse has issues with static imports in Next.js
    const { default: pdfParse } = (await import("pdf-parse")) as any;
    const data = await pdfParse(buffer);
    return data.text ?? "";
  } catch (err) {
    console.error("PDF extraction error:", err);
    return "";
  }
}

// ─── DOCX extraction ──────────────────────────────────────────────────────────
// Uses mammoth to extract text from DOCX buffer.
// mammoth preserves paragraph structure better than other libraries.

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      // Log warnings but don't fail
      console.warn("DOCX extraction warnings:", result.messages);
    }

    return result.value ?? "";
  } catch (err) {
    console.error("DOCX extraction error:", err);
    return "";
  }
}

// ─── Detect file type ─────────────────────────────────────────────────────────
// Determines whether a file is PDF or DOCX from:
// 1. File path extension (primary)
// 2. File magic bytes (fallback — more reliable)
//
// Magic bytes:
//   PDF  starts with: %PDF  (hex: 25 50 44 46)
//   DOCX starts with: PK    (hex: 50 4B — it's a ZIP file internally)

function detectFileType(
  filePath: string,
  buffer: Buffer,
): "pdf" | "docx" | "unknown" {
  // Check extension first
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";

  // Fallback: check magic bytes
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "pdf"; // %PDF
  }

  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "docx"; // PK (ZIP/DOCX)
  }

  return "unknown";
}

// ─── POST /api/extract-cv ─────────────────────────────────────────────────────
// Main extraction endpoint.
//
// Request body:
// {
//   filePath: string   (path in Supabase Storage, e.g. "company_id/job_id/cv.pdf")
//   cvId:     string   (cv_uploads.id — used to cache result)
// }
//
// Response:
// {
//   success:   true,
//   text:      "John Smith\nSenior Developer\n5 years experience...",
//   wordCount: 342,
//   method:    "pdf" | "docx" | "cached",
//   cvId:      "uuid"
// }

export async function POST(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();

    // 1. Parse request body
    const body = await req.json();
    const { filePath, cvId } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath is required" },
        { status: 400 },
      );
    }

    if (!cvId) {
      return NextResponse.json({ error: "cvId is required" }, { status: 400 });
    }

    // 2. Check cache — return if already extracted
    // This prevents re-downloading and re-parsing the same file
    const { data: cvRecord } = await admin
      .from("cv_uploads")
      .select("parsed_text, extraction_status, original_filename")
      .eq("id", cvId)
      .single();

    if (cvRecord?.parsed_text && cvRecord.extraction_status === "completed") {
      console.log(`Using cached text for cvId: ${cvId}`);
      const wordCount = cvRecord.parsed_text
        .split(/\s+/)
        .filter(Boolean).length;

      return NextResponse.json({
        success: true,
        text: cvRecord.parsed_text,
        wordCount,
        method: "cached",
        cvId,
      });
    }

    // 3. Mark extraction as in progress
    await admin
      .from("cv_uploads")
      .update({ extraction_status: "processing" })
      .eq("id", cvId);

    // 4. Download file from Supabase Storage
    console.log(`Downloading CV from storage: ${filePath}`);

    const { data: fileData, error: downloadErr } = await admin.storage
      .from("cvs")
      .download(filePath);

    if (downloadErr || !fileData) {
      console.error("Storage download error:", downloadErr);

      await admin
        .from("cv_uploads")
        .update({ extraction_status: "failed" })
        .eq("id", cvId);

      return NextResponse.json(
        { error: "Failed to download CV from storage" },
        { status: 500 },
      );
    }

    // 5. Convert Blob to Buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      `Downloaded CV: ${filePath}, ` +
        `size: ${(buffer.length / 1024).toFixed(1)}KB`,
    );

    // 6. Detect file type and extract text
    const fileType = detectFileType(filePath, buffer);
    let rawText = "";
    let method = fileType;

    console.log(
      `Extracting text from ${fileType} — ` +
        `file: ${cvRecord?.original_filename ?? filePath}`,
    );

    if (fileType === "pdf") {
      rawText = await extractFromPDF(buffer);
    } else if (fileType === "docx") {
      rawText = await extractFromDOCX(buffer);
    } else {
      // Unknown file type — try PDF first then DOCX
      console.warn(`Unknown file type for: ${filePath} — trying PDF parser`);
      rawText = await extractFromPDF(buffer);

      if (!rawText) {
        rawText = await extractFromDOCX(buffer);
        method = "docx";
      }
    }

    // 7. Clean the extracted text
    const cleanedText = cleanExtractedText(rawText);
    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

    console.log(
      `Extraction complete — ` +
        `method: ${method}, words: ${wordCount}, ` +
        `chars: ${cleanedText.length}`,
    );

    // 8. Handle extraction failure
    // If no text extracted — mark failed but don't crash
    // Claude will receive empty text and give low scores
    if (!cleanedText || wordCount < 10) {
      console.warn(
        `Very little text extracted for cvId: ${cvId} ` +
          `(${wordCount} words) — may be scanned image CV`,
      );

      await admin
        .from("cv_uploads")
        .update({
          parsed_text: cleanedText || "",
          extraction_status: wordCount < 10 ? "failed" : "completed",
        })
        .eq("id", cvId);

      // Still return what we have — let Claude handle it
      return NextResponse.json({
        success: wordCount >= 10,
        text: cleanedText,
        wordCount,
        method,
        cvId,
        warning:
          wordCount < 10
            ? "Very little text extracted. CV may be a scanned image. " +
              "Consider asking candidate to resubmit as text-based PDF."
            : undefined,
      });
    }

    // 9. Save extracted text to cv_uploads (cache for future use)
    await admin
      .from("cv_uploads")
      .update({
        parsed_text: cleanedText,
        extraction_status: "completed",
      })
      .eq("id", cvId);

    // 10. Return success
    return NextResponse.json({
      success: true,
      text: cleanedText,
      wordCount,
      method,
      cvId,
    });
  } catch (err) {
    console.error("POST /api/extract-cv error:", err);
    return NextResponse.json(
      { error: "Internal server error during text extraction" },
      { status: 500 },
    );
  }
}

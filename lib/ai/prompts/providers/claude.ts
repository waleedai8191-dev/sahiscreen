import {
  buildScreeningPrompt,
  parseAndValidateScreeningResponse,
  ScreeningPromptInput,
  ScreeningResult,
} from "@/lib/ai/prompts/screening-prompt";

// ─── Config ───────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeRequestBody {
  model: string;
  max_tokens: number;
  system: string;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
// Waits for `ms` milliseconds before resolving.
// Used between retry attempts.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Claude screening function ──────────────────────────────────────────
// Takes CV + job data → returns ScreeningResult or throws.
//
// Called by: lib/ai/screening-engine.ts
// Never called directly from API routes.

export async function screenWithClaude(
  input: ScreeningPromptInput,
): Promise<ScreeningResult> {
  // 1. Get API key — fail fast if missing
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set in environment variables. " +
        "Add it to your .env.local file.",
    );
  }

  // 2. Build prompts from the central prompt builder
  // We NEVER write prompt strings here — always import from prompts/
  const { systemPrompt, userPrompt } = buildScreeningPrompt(input);

  // 3. Build request body for Anthropic API
  const requestBody: ClaudeRequestBody = {
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt, // ← system prompt goes here in Claude API
    messages: [
      {
        role: "user",
        content: userPrompt, // ← CV + job data goes here
      },
    ],
  };

  // 4. Attempt API call with retry logic
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Wait before retry (not on first attempt)
      if (attempt > 1) {
        const waitMs = (attempt - 1) * 1000; // 1s, 2s
        console.log(`Claude retry attempt ${attempt}, waiting ${waitMs}ms...`);
        await sleep(waitMs);
      }

      // 5. Make the API call
      const response = await fetch(CLAUDE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01", // required header
        },
        body: JSON.stringify(requestBody),
      });

      // 6. Handle HTTP errors
      if (!response.ok) {
        const errorBody = await response.text();

        // 529 = API overloaded — retry
        // 500 = server error — retry
        // 429 = rate limited — retry with longer wait
        if (
          [429, 500, 529].includes(response.status) &&
          attempt < MAX_RETRIES
        ) {
          lastError = new Error(
            `Claude API returned ${response.status}: ${errorBody}`,
          );
          console.warn(
            `Claude attempt ${attempt} failed (${response.status}), retrying...`,
          );
          continue; // go to next retry
        }

        // 401 = bad API key — don't retry, fail immediately
        if (response.status === 401) {
          throw new Error(
            "Claude API key is invalid or expired. " +
              "Check ANTHROPIC_API_KEY in your environment variables.",
          );
        }

        // 400 = bad request — our prompt has an issue, don't retry
        if (response.status === 400) {
          throw new Error(
            `Claude API rejected the request (400): ${errorBody}. ` +
              "Check prompt format.",
          );
        }

        throw new Error(`Claude API error ${response.status}: ${errorBody}`);
      }

      // 7. Parse the response
      const data: ClaudeResponse = await response.json();

      // Validate response structure
      if (!data.content || data.content.length === 0) {
        throw new Error("Claude returned empty content array");
      }

      const rawText = data.content[0]?.text;
      if (!rawText) {
        throw new Error("Claude returned no text in content[0]");
      }

      // Log token usage for cost monitoring
      if (data.usage) {
        console.log(
          `Claude tokens — input: ${data.usage.input_tokens}, ` +
            `output: ${data.usage.output_tokens}`,
        );
      }

      // 8. Parse and validate the JSON response
      // This is where we ensure AI returned correct schema
      const result = parseAndValidateScreeningResponse(rawText);

      if (!result) {
        throw new Error(
          "Claude returned invalid JSON or missing required fields. " +
            `Raw response: ${rawText.slice(0, 200)}`,
        );
      }

      // 9. Tag which model produced this result
      result.model_used = `claude/${CLAUDE_MODEL}`;

      console.log(
        `✅ Claude screening complete — ` +
          `score: ${result.overall_score}, ` +
          `recommendation: ${result.recommendation}`,
      );

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Only retry on network errors or 5xx — not on validation errors
      const isRetryable =
        lastError.message.includes("fetch") || // network error
        lastError.message.includes("500") ||
        lastError.message.includes("529") ||
        lastError.message.includes("429");

      if (!isRetryable || attempt >= MAX_RETRIES) {
        break; // stop retrying
      }

      console.warn(`Claude attempt ${attempt} error: ${lastError.message}`);
    }
  }

  // All retries failed
  throw new Error(
    `Claude screening failed after ${MAX_RETRIES} attempts. ` +
      `Last error: ${lastError?.message ?? "unknown"}`,
  );
}

// ─── Health check helper ──────────────────────────────────────────────────────
// Called by admin panel to verify Claude API key is working.
// Sends a minimal request — not a full screening prompt.

export async function checkClaudeHealth(): Promise<{
  ok: boolean;
  model: string;
  message: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      model: CLAUDE_MODEL,
      message: "ANTHROPIC_API_KEY not set",
    };
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 10,
        messages: [{ role: "user", content: "Reply with: ok" }],
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        model: CLAUDE_MODEL,
        message: "Claude API is reachable and key is valid",
      };
    }

    return {
      ok: false,
      model: CLAUDE_MODEL,
      message: `Claude API returned ${response.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      model: CLAUDE_MODEL,
      message: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}

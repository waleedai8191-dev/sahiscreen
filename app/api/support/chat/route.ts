import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SAHISCREEN_SUPPORT_PROMPT } from "@/lib/ai/support-prompt";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth — support chat is dashboard-only
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse messages (full conversation history for context)
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // 3. Call Groq API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // fastest model, great for support
          max_tokens: 512, // keep answers concise
          temperature: 0.4, // low = consistent, factual answers
          messages: [
            { role: "system", content: SAHISCREEN_SUPPORT_PROMPT },
            ...messages.slice(-10), // last 10 messages = enough context
          ],
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq API error:", err);
      return NextResponse.json(
        { error: "AI assistant unavailable. Please try again." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Support chat error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

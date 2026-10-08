import { NextResponse } from "next/server";
import { llmConfigured } from "@/lib/llm";

// Tells the UI whether a real AI key is set. Never returns any secret.
export async function GET() {
  return NextResponse.json({
    ai: llmConfigured(),
    model: llmConfigured() ? process.env.LLM_MODEL : null,
    market: Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
  });
}

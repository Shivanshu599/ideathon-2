import { NextResponse } from "next/server";
import { allow } from "@/lib/guard";
import { askJSON, llmConfigured } from "@/lib/llm";
import { DEMO_STEP } from "@/lib/demo";
import { buildStepPrompt, cleanStepInput } from "@/lib/prompts";
import { StepSchema } from "@/lib/schema";

export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!allow(req)) return fail("Too many requests. Please wait a few minutes and try again.", 429);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.", 400);

  const input = cleanStepInput(body);
  if (!input.label) return fail("Missing step.", 400);

  if (!llmConfigured()) return NextResponse.json({ demo: true, plan: DEMO_STEP });

  try {
    const raw = await askJSON(buildStepPrompt(input));
    const parsed = StepSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Step plan did not match the expected shape");
    return NextResponse.json({ demo: false, plan: parsed.data });
  } catch (e) {
    console.error("step error:", e instanceof Error ? e.message : e);
    return fail("Could not write a plan for this step. Try again.", 502);
  }
}

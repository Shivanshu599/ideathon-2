import { NextResponse } from "next/server";
import { allow } from "@/lib/guard";
import { askJSON, llmConfigured } from "@/lib/llm";
import { DEMO_ROADMAP } from "@/lib/demo";
import { fetchMarket } from "@/lib/market";
import { buildRoadmapPrompt, cleanPlanInput } from "@/lib/prompts";
import { RoadmapSchema, normalize } from "@/lib/schema";

export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!allow(req)) return fail("Too many requests. Please wait a few minutes and try again.", 429);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.", 400);

  const input = cleanPlanInput(body);
  if (input.goal.length < 3) return fail("Enter a job title between 3 and 140 characters.", 400);

  if (!llmConfigured()) return NextResponse.json({ demo: true, roadmap: DEMO_ROADMAP });

  try {
    const market = await fetchMarket(input.goal); // live job data, only if Adzuna keys are set
    const raw = await askJSON(buildRoadmapPrompt(input, market));
    const parsed = RoadmapSchema.safeParse(raw);
    if (!parsed.success) throw new Error("Roadmap did not match the expected shape");
    return NextResponse.json({ demo: false, roadmap: normalize(parsed.data), market });
  } catch (e) {
    console.error("roadmap error:", e instanceof Error ? e.message : e);
    return fail("The AI could not build a roadmap right now. Try again or reword the job title.", 502);
  }
}

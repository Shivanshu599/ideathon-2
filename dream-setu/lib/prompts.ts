import { DEFAULT_SETTINGS, clamp, type ChatContext, type Settings } from "./types";
import { marketPrompt, type Market } from "./market";

const s = (v: unknown, max: number) =>
  String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

export function cleanSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    ...DEFAULT_SETTINGS,
    bg: s(r.bg, 120),
    budget: s(r.budget, 40),
    region: s(r.region, 60),
    style: s(r.style, 30) || "Mixed",
    lang: s(r.lang, 30) || "English",
    co: s(r.co, 40) || "Any",
    n: clamp(Number(r.n) || 15, 8, 24),
  };
}

export function profileText(st: Settings, level: string): string {
  const a: string[] = [];
  if (level) a.push(`Current level: ${level}.`);
  if (st.bg) a.push(`Background: ${st.bg}.`);
  if (st.budget) a.push(`Budget per month: ${st.budget}.`);
  if (st.region) a.push(`Location: ${st.region}.`);
  a.push(`Learns best by: ${st.style}. Prefers resources in ${st.lang}.`);
  if (st.co !== "Any") a.push(`Prefers ${st.co} employers.`);
  return a.join(" ");
}

export type PlanInput = {
  goal: string;
  hours: number;
  months: number;
  level: string;
  settings: Settings;
  known: string[];
};

export function cleanPlanInput(body: Record<string, unknown>): PlanInput {
  const known = Array.isArray(body.known) ? body.known.slice(0, 40).map((k) => s(k, 80)).filter(Boolean) : [];
  return {
    goal: s(body.goal, 140),
    hours: clamp(Number(body.hours) || 10, 1, 80),
    months: clamp(Number(body.months) || 6, 1, 60),
    level: s(body.level, 40),
    settings: cleanSettings(body.settings),
    known,
  };
}

export function buildRoadmapPrompt(i: PlanInput, market: Market | null = null): string {
  return `You are a career strategist who knows real hiring paths in India and globally. Create a realistic, reverse-engineered roadmap for this dream job: "${i.goal}".
The learner has ${i.hours} hours per week and ${i.months} months. ${profileText(i.settings, i.level)}
${marketPrompt(market)}
${i.known.length ? `They already know or completed these, so leave them out: ${i.known.join("; ")}.` : ""}
Return ONLY JSON, no markdown:
{"title":string,"summary":string (2 sentences),"phases":[4 short phase names],"nodes":[{"id":short-slug,"label":string (max 40 chars),"phase":0-3,"type":"skill|role|cert|project|milestone","weeks":integer (effort at 10 hours per week),"desc":string (1-2 concrete sentences),"requires":[ids of earlier nodes]}],"paths":[{"who":string,"journey":[3-5 short steps],"tip":string}] (exactly 2 realistic archetypes)}
Rules: about ${i.settings.n} nodes (never fewer than 8). Use real tools, real certifications, real intermediate job titles and concrete side projects specific to "${i.goal}". Entry nodes have requires []. Every requires id must exist. Exactly one final node of type milestone is the target role. Fit the plan to the time budget. If the input is not a job or career goal, still return the JSON for the closest sensible career.`;
}

export type StepInput = {
  goal: string;
  label: string;
  type: string;
  desc: string;
  hours: number;
  level: string;
  settings: Settings;
};

export function cleanStepInput(body: Record<string, unknown>): StepInput {
  const n = (body.node && typeof body.node === "object" ? body.node : {}) as Record<string, unknown>;
  return {
    goal: s(body.goal, 140),
    label: s(n.label, 80),
    type: s(n.type, 20),
    desc: s(n.desc, 500),
    hours: clamp(Number(body.hours) || 10, 1, 80),
    level: s(body.level, 40),
    settings: cleanSettings(body.settings),
  };
}

export function buildStepPrompt(i: StepInput): string {
  return `Goal: "${i.goal}". The learner is on this step: "${i.label}" (${i.type}) - ${i.desc}. They have ${i.hours} hours per week. ${profileText(i.settings, i.level)}
Return ONLY JSON: {"project":{"title":string,"brief":string (2 sentences, a concrete weekend project),"steps":[3-4 short actions]},"repo":{"name":string,"why":string},"questions":[4 objects {"q":string,"hint":string}] (real interview questions for this skill),"resource":{"title":string,"why":string}}
Be specific to this goal. For repo, give a real well-known open-source repository (owner/name) only if you are sure it exists; otherwise write "Search GitHub for: <query>". Never invent links.`;
}

export function cleanContext(raw: unknown): ChatContext {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const steps = Array.isArray(r.steps) ? r.steps.slice(0, 40) : [];
  return {
    goal: s(r.goal, 140),
    hours: clamp(Number(r.hours) || 10, 1, 80),
    months: clamp(Number(r.months) || 6, 1, 60),
    level: s(r.level, 40),
    settings: cleanSettings(r.settings),
    steps: steps.map((x) => {
      const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      return { label: s(o.label, 80), status: s(o.status, 20) };
    }),
    selected: r.selected ? s(r.selected, 80) : null,
  };
}

export function buildChatSystem(c: ChatContext): string {
  const steps = c.steps.length ? c.steps.map((x) => `${x.label} [${x.status}]`).join("; ") : "none yet";
  return `You are Dream Setu AI, a friendly and honest career coach inside a roadmap app. You are an AI. Answer in under 170 words with short bullets, real tool, course and company names, and say when you are unsure. Never invent links or statistics.
Goal: ${c.goal || "not set"}. Time: ${c.hours} hours per week for ${c.months} months. ${profileText(c.settings, c.level)}
Roadmap steps: ${steps}.${c.selected ? `\nSelected step: ${c.selected}.` : ""}`;
}

import { RoadmapSchema, normalize, type Roadmap } from "./schema";
import type { Status } from "./types";

/** Roadmap -> URL-safe text, so a roadmap can be shared as a link (no server needed). */
export function encodeShare(goal: string, roadmap: Roadmap): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ g: goal, r: roadmap }));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(s: string): { goal: string; roadmap: Roadmap } | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes)) as { g?: string; r?: unknown };
    const p = RoadmapSchema.safeParse(o.r);
    return p.success ? { goal: String(o.g ?? ""), roadmap: normalize(p.data) } : null;
  } catch {
    return null;
  }
}

/** Roadmap -> Markdown checklist grouped by phase. */
export function toMarkdown(goal: string, rm: Roadmap, status: Record<string, Status>, hours: number): string {
  const out = [`# ${rm.title}`, "", `Goal: ${goal}`, "", rm.summary, ""];
  rm.phases.forEach((p, i) => {
    const items = rm.nodes.filter((n) => n.phase === i);
    if (!items.length) return;
    out.push(`## ${i + 1}. ${p}`);
    items.forEach((n) => {
      const mark = status[n.id] ? "x" : " ";
      out.push(`- [${mark}] **${n.label}** (${n.type}, ~${((n.weeks * 10) / hours).toFixed(1)} wk at ${hours} h/week) - ${n.desc}`);
    });
    out.push("");
  });
  return out.join("\n");
}

export function roadmapStats(rm: Roadmap, hours: number) {
  const count = (t: string) => rm.nodes.filter((n) => n.type === t).length;
  return {
    steps: rm.nodes.length,
    months: (rm.nodes.reduce((a, n) => a + n.weeks, 0) * 10) / hours / 4.33,
    skills: count("skill"),
    certs: count("cert"),
    projects: count("project"),
    roles: count("role"),
  };
}

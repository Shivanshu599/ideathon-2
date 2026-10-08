import { z } from "zod";

export const NODE_TYPES = ["skill", "role", "cert", "project", "milestone"] as const;

const NodeSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  phase: z.coerce.number().int().min(0).max(4).catch(0),
  type: z.enum(NODE_TYPES).catch("skill"),
  weeks: z.coerce.number().min(1).max(104).catch(2),
  desc: z.string().max(500).catch(""),
  requires: z.array(z.string()).catch([]),
});

const PathSchema = z.object({
  who: z.string().max(120).catch("Someone on this path"),
  journey: z.array(z.string().max(80)).max(8).catch([]),
  tip: z.string().max(300).catch(""),
});

export const RoadmapSchema = z.object({
  title: z.string().max(140),
  summary: z.string().max(600).catch(""),
  phases: z.array(z.string().max(40)).min(2).max(5),
  nodes: z.array(NodeSchema).min(5).max(30),
  paths: z.array(PathSchema).max(3).catch([]),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;
export type RNode = Roadmap["nodes"][number];

export const StepSchema = z.object({
  project: z.object({
    title: z.string(),
    brief: z.string(),
    steps: z.array(z.string()).max(6).catch([]),
  }),
  repo: z.object({ name: z.string(), why: z.string().catch("") }),
  questions: z.array(z.object({ q: z.string(), hint: z.string().catch("") })).max(8),
  resource: z.object({ title: z.string(), why: z.string().catch("") }).nullable().catch(null),
});

export type StepPlan = z.infer<typeof StepSchema>;

/** Clean up AI output: unique ids, valid phases, valid prerequisites, no cycles. */
export function normalize(rm: Roadmap): Roadmap {
  const seen = new Set<string>();
  const nodes: RNode[] = [];
  for (const n of rm.nodes) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    nodes.push({ ...n, phase: Math.min(n.phase, rm.phases.length - 1) });
  }
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    n.requires = Array.from(new Set(n.requires)).filter((r) => ids.has(r) && r !== n.id);
  }
  const by = new Map(nodes.map((n) => [n.id, n] as const));
  const state = new Map<string, number>();
  const dfs = (n: RNode): void => {
    state.set(n.id, 1);
    n.requires = n.requires.filter((r) => {
      const s = state.get(r);
      if (s === 1) return false; // would create a cycle
      if (s === undefined) {
        const p = by.get(r);
        if (p) dfs(p);
      }
      return true;
    });
    state.set(n.id, 2);
  };
  for (const n of nodes) if (!state.has(n.id)) dfs(n);
  return { ...rm, nodes };
}

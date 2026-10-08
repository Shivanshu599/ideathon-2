import type { RNode } from "./schema";
import type { Status } from "./types";

export const NODE_W = 190;
export const NODE_H = 64;
export const GAP_X = 270;
export const GAP_Y = 92;

/** Cleared steps (known or done) move to column 0 "base camp"; the rest are layered by prerequisites. */
export function computeLayout(nodes: RNode[], status: Record<string, Status>) {
  const by = new Map(nodes.map((n) => [n.id, n] as const));
  const depth = new Map<string, number>();

  const visit = (n: RNode, stack: Set<string>): number => {
    if (status[n.id]) return 0;
    const cached = depth.get(n.id);
    if (cached !== undefined) return cached;
    if (stack.has(n.id)) return 1;
    stack.add(n.id);
    let d = 1;
    for (const r of n.requires) {
      const p = by.get(r);
      if (p && !status[p.id]) d = Math.max(d, 1 + visit(p, stack));
    }
    stack.delete(n.id);
    depth.set(n.id, d);
    return d;
  };
  nodes.forEach((n) => visit(n, new Set()));

  const cols = new Map<number, RNode[]>();
  for (const n of nodes) {
    const d = status[n.id] ? 0 : depth.get(n.id) ?? 1;
    const arr = cols.get(d) ?? [];
    arr.push(n);
    cols.set(d, arr);
  }
  const pos: Record<string, { x: number; y: number }> = {};
  cols.forEach((arr, d) => {
    arr.sort((a, b) => a.phase - b.phase);
    arr.forEach((n, i) => {
      pos[n.id] = { x: d * GAP_X, y: (i - (arr.length - 1) / 2) * GAP_Y };
    });
  });
  return pos;
}

export function isLocked(n: RNode, status: Record<string, Status>, ids: Set<string>): boolean {
  return !status[n.id] && n.requires.some((r) => ids.has(r) && !status[r]);
}

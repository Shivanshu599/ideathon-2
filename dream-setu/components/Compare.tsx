"use client";

import { useEffect, useRef, useState } from "react";
import type { Roadmap } from "@/lib/schema";
import { roadmapStats } from "@/lib/share";
import type { Settings } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  a: Roadmap | null;
  goalA: string;
  hours: number;
  months: number;
  level: string;
  settings: Settings;
};

const top = (xs: string[]) => (xs.length ? xs.slice(0, 6).join(", ") : "none");

export default function Compare({ open, onClose, a, goalA, hours, months, level, settings }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [goalB, setGoalB] = useState("");
  const [b, setB] = useState<Roadmap | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  async function run() {
    if (goalB.trim().length < 3) return setErr("Type the second job first.");
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalB.trim(), hours, months, level, settings, known: [] }),
      });
      const d = (await res.json()) as { roadmap?: Roadmap; error?: string };
      if (!res.ok || !d.roadmap) throw new Error(d.error || "Could not build the second roadmap.");
      setB(d.roadmap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network problem.");
    } finally {
      setBusy(false);
    }
  }

  const sa = a ? roadmapStats(a, hours) : null;
  const sb = b ? roadmapStats(b, hours) : null;
  const la = new Map((a?.nodes ?? []).map((n) => [n.label.toLowerCase(), n.label] as const));
  const lb = new Map((b?.nodes ?? []).map((n) => [n.label.toLowerCase(), n.label] as const));
  const both = [...la.keys()].filter((k) => lb.has(k)).map((k) => la.get(k)!);
  const onlyA = [...la.keys()].filter((k) => !lb.has(k)).map((k) => la.get(k)!);
  const onlyB = [...lb.keys()].filter((k) => !la.has(k)).map((k) => lb.get(k)!);
  const rows: [string, string, string][] = sa && sb && a && b ? [
    ["Role", a.title, b.title],
    ["Steps", String(sa.steps), String(sb.steps)],
    ["Time needed", `${sa.months.toFixed(1)} months`, `${sb.months.toFixed(1)} months`],
    ["Fits your " + months + "-month goal", sa.months <= months ? "Yes" : "No", sb.months <= months ? "Yes" : "No"],
    ["Skills / Certs", `${sa.skills} / ${sa.certs}`, `${sb.skills} / ${sb.certs}`],
    ["Projects / Jobs on the way", `${sa.projects} / ${sa.roles}`, `${sb.projects} / ${sb.roles}`],
  ] : [];

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="ct" style={{ width: "min(760px,calc(100vw - 24px))" }}>
      <h2 id="ct">Compare two dream roles</h2>
      <small className="mut">Role A is your current roadmap. Type role B and the AI builds it with the same hours, months and settings.</small>
      <div className="row" style={{ marginTop: 12 }}>
        <label className="f grow">Role A<input type="text" value={goalA} readOnly /></label>
        <label className="f grow">Role B<input type="text" value={goalB} maxLength={140} placeholder="e.g. Data Analyst at a hospital network" onChange={(e) => setGoalB(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void run()} /></label>
        <button className="btn" type="button" disabled={busy || !a} onClick={() => void run()}>{busy ? "Building…" : "Compare"}</button>
      </div>
      {err && <div className="note on" role="alert">{err}</div>}
      {rows.length > 0 && (
        <>
          <table className="cmp">
            <thead><tr><th></th><th>A</th><th>B</th></tr></thead>
            <tbody>{rows.map(([k, x, y]) => <tr key={k}><th>{k}</th><td>{x}</td><td>{y}</td></tr>)}</tbody>
          </table>
          <p><b>Common steps:</b> {top(both)}</p>
          <p><b>Only in A:</b> {top(onlyA)}</p>
          <p><b>Only in B:</b> {top(onlyB)}</p>
        </>
      )}
      <div className="acts"><button className="btn ghost" type="button" onClick={onClose}>Close</button></div>
    </dialog>
  );
}

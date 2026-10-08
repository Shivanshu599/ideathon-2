"use client";

import type { Roadmap, RNode, StepPlan } from "@/lib/schema";
import { TYPE_LABEL, type Status } from "@/lib/types";
import type { Market } from "@/lib/market";

export type PlanState = { state: "loading" } | { state: "error" } | { state: "ok"; plan: StepPlan };

const pc = (i: number) => `var(--p${i % 5})`;

export function Overview({
  roadmap,
  hours,
  onReplan,
  onExport,
  market,
}: {
  roadmap: Roadmap;
  hours: number;
  onReplan: () => void;
  onExport: () => void;
  market?: Market | null;
}) {
  return (
    <>
      <span className="tag" style={{ background: "var(--p1)" }}>Your roadmap</span>
      <h2>{roadmap.title}</h2>
      <p>{roadmap.summary}</p>
      <div className="acts">
        <button className="btn" type="button" onClick={onReplan}>Re-plan for {hours} h/week</button>
        <button className="btn ghost" type="button" onClick={onExport}>Export JSON</button>
      </div>
      <p className="small">Click any step for a tailored plan. Mark steps you already know and the map re-routes around them.</p>
      {market && (
        <>
          <h3>Live job-market data</h3>
          <div className="box">
            <b>{market.count.toLocaleString()} open ads · {market.source}</b>
            {market.salary && <p>Typical pay: {market.salary.cur}{Math.round(market.salary.min).toLocaleString()} to {market.salary.cur}{Math.round(market.salary.max).toLocaleString()} per year</p>}
            <p>Most asked skills: {market.skills.map((s) => `${s.name} (${s.n})`).join(", ") || "n/a"}</p>
            <p className="small">Titles seen: {market.titles.join(" · ")}</p>
          </div>
        </>
      )}
      {roadmap.paths.length > 0 && <h3>People who took this path</h3>}
      {roadmap.paths.map((p, i) => (
        <div className="box" key={i}>
          <b>{p.who}</b>
          <p>{p.journey.join(" → ")}</p>
          <p><i>{p.tip}</i></p>
        </div>
      ))}
      <p className="small">This roadmap was written by an AI model. Check real job posts before you spend money on a course or certificate.</p>
    </>
  );
}

export function StepPanel({
  roadmap,
  node,
  status,
  locked,
  hours,
  plan,
  onBack,
  onKnown,
  onDone,
  onAsk,
  onRetry,
}: {
  roadmap: Roadmap;
  node: RNode;
  status?: Status;
  locked: boolean;
  hours: number;
  plan?: PlanState;
  onBack: () => void;
  onKnown: () => void;
  onDone: () => void;
  onAsk: () => void;
  onRetry: () => void;
}) {
  const pre = node.requires
    .map((r) => roadmap.nodes.find((n) => n.id === r)?.label)
    .filter((x): x is string => Boolean(x));

  return (
    <>
      <button className="chip" type="button" onClick={onBack}>← Overview</button>
      <div style={{ marginTop: 12 }}>
        <span className="tag" style={{ background: pc(node.phase) }}>
          {TYPE_LABEL[node.type] ?? "Step"} · {roadmap.phases[node.phase] ?? ""}
        </span>
      </div>
      <h2>{node.label}</h2>
      <p>{node.desc}</p>
      <p className="small">
        About {((node.weeks * 10) / hours).toFixed(1)} weeks at {hours} h/week
        {pre.length ? `. Needs: ${pre.join(", ")}` : ""}
        {locked ? ". Locked until its prerequisites are cleared." : ""}
      </p>
      <div className="acts">
        <button className="btn ghost" type="button" onClick={onKnown}>
          {status === "known" ? "Undo: I already know this" : "I already know this"}
        </button>
        <button className="btn" type="button" onClick={onDone}>
          {status === "done" ? "Mark not done" : "Mark complete"}
        </button>
        <button className="btn ghost" type="button" onClick={onAsk}>💬 Ask AI about this step</button>
      </div>

      {(!plan || plan.state === "loading") && (
        <div aria-live="polite">
          <div className="sk" /><div className="sk" style={{ width: "80%" }} /><div className="sk" style={{ width: "90%" }} />
          <p>Writing your plan for this step…</p>
        </div>
      )}
      {plan?.state === "error" && (
        <div className="box">
          Could not write the plan for this step.{" "}
          <button className="chip" type="button" onClick={onRetry}>Try again</button>
        </div>
      )}
      {plan?.state === "ok" && (
        <>
          <h3>Weekend project</h3>
          <div className="box">
            <b>{plan.plan.project.title}</b>
            <p>{plan.plan.project.brief}</p>
            <ol>{plan.plan.project.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          <h3>Repo to study</h3>
          <div className="box"><b>{plan.plan.repo.name}</b><p>{plan.plan.repo.why}</p></div>
          <h3>Interview questions for this step</h3>
          {plan.plan.questions.map((q, i) => (
            <details className="box" key={i}>
              <summary>{q.q}</summary>
              <p>Hint: {q.hint}</p>
            </details>
          ))}
          {plan.plan.resource && (
            <>
              <h3>Learn from</h3>
              <div className="box"><b>{plan.plan.resource.title}</b><p>{plan.plan.resource.why}</p></div>
            </>
          )}
        </>
      )}
    </>
  );
}

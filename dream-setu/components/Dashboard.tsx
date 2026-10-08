"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Roadmap, RNode, StepPlan } from "@/lib/schema";
import { isLocked } from "@/lib/layout";
import { DEFAULT_SETTINGS, clamp, type ChatContext, type Settings, type Status } from "@/lib/types";
import RoadmapMap from "./RoadmapMap";
import { Overview, StepPanel, type PlanState } from "./Panels";
import ChatBot from "./ChatBot";
import SettingsDialog from "./SettingsDialog";
import FeatureBar, { type Feature } from "./FeatureBar";
import HelpDialog from "./HelpDialog";
import Compare from "./Compare";
import { decodeShare, encodeShare, toMarkdown } from "@/lib/share";
import type { Market } from "@/lib/market";

const KEY = "dreamsetu.v1";

type Saved = {
  goal: string;
  hours: string;
  months: string;
  level: string;
  settings: Settings;
  roadmap: Roadmap | null;
  demo: boolean;
  status: Record<string, Status>;
  market?: Market | null;
};

const EXAMPLE_GOALS = [
  "UI/UX Designer for fintech apps",
  "Data Analyst at a hospital network",
  "Backend Engineer at a gaming studio",
  "Full Stack Developer at a climate tech startup",
];

export default function Dashboard() {
  const [goal, setGoal] = useState("");
  const [hoursStr, setHoursStr] = useState("10");
  const [monthsStr, setMonthsStr] = useState("6");
  const [level, setLevel] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [demo, setDemo] = useState(false);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, PlanState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<{ text: string; n: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [market, setMarket] = useState<Market | null>(null);
  const [ai, setAi] = useState<{ ai: boolean; model: string | null } | null>(null);
  const act = useRef<Record<string, () => void>>({});
  const requested = useRef(new Set<string>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hours = clamp(Math.round(Number(hoursStr)) || 10, 1, 80);
  const months = clamp(Math.round(Number(monthsStr)) || 6, 1, 60);

  /* ---------- persistence (browser only, no server storage) ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Saved>;
        if (typeof s.goal === "string") setGoal(s.goal);
        if (typeof s.hours === "string") setHoursStr(s.hours);
        if (typeof s.months === "string") setMonthsStr(s.months);
        if (typeof s.level === "string") setLevel(s.level);
        if (s.settings) setSettings({ ...DEFAULT_SETTINGS, ...s.settings });
        if (s.roadmap && Array.isArray(s.roadmap.nodes)) {
          setRoadmap(s.roadmap);
          setDemo(Boolean(s.demo));
          setStatus(s.status ?? {});
          setMarket(s.market ?? null);
        }
      }
    } catch {
      /* storage unavailable or corrupted: start fresh */
    }
    // opened from a shared link (#share=...)
    const m = /^#share=(.+)$/.exec(window.location.hash);
    const shared = m ? decodeShare(m[1]) : null;
    if (shared) {
      setGoal(shared.goal);
      setRoadmap(shared.roadmap);
      setDemo(false);
      setStatus({});
      setMarket(null);
    }
    fetch("/api/status").then((r) => r.json()).then((d) => setAi(d)).catch(() => setAi(null));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const data: Saved = { goal, hours: hoursStr, months: monthsStr, level, settings, roadmap, demo, status, market };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [loaded, goal, hoursStr, monthsStr, level, settings, roadmap, demo, status, market]);

  useEffect(() => {
    const d = document.documentElement;
    if (settings.theme === "auto") d.removeAttribute("data-theme");
    else d.setAttribute("data-theme", settings.theme);
    document.body.style.fontSize = settings.size === "l" ? "17px" : "15px";
    document.body.classList.toggle("calm", settings.calm);
  }, [settings]);

  const say = useCallback((t: string) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  /* ---------- roadmap generation ---------- */
  async function generate(replan: boolean) {
    const g = goal.trim();
    if (g.length < 3) {
      setError("Type your dream job first (at least 3 characters).");
      return;
    }
    const known =
      replan && roadmap
        ? Object.keys(status).map((id) => roadmap.nodes.find((n) => n.id === id)?.label).filter((x): x is string => Boolean(x))
        : [];
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: g, hours, months, level, settings, known }),
      });
      const data = (await res.json()) as { roadmap?: Roadmap; demo?: boolean; market?: Market | null; error?: string };
      if (!res.ok || !data.roadmap) throw new Error(data.error || "Something went wrong. Try again.");
      requested.current.clear();
      setRoadmap(data.roadmap);
      setMarket(data.market ?? null);
      setDemo(Boolean(data.demo));
      setStatus({});
      setPlans({});
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network problem. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- step plans ---------- */
  const loadPlan = useCallback(
    async (node: RNode) => {
      requested.current.add(node.id);
      setPlans((p) => ({ ...p, [node.id]: { state: "loading" } }));
      try {
        const res = await fetch("/api/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, node: { label: node.label, type: node.type, desc: node.desc }, hours, level, settings }),
        });
        const data = (await res.json()) as { plan?: StepPlan; error?: string };
        const plan = data.plan;
        if (!res.ok || !plan) throw new Error(data.error);
        setPlans((p) => ({ ...p, [node.id]: { state: "ok", plan } }));
      } catch {
        setPlans((p) => ({ ...p, [node.id]: { state: "error" } }));
      }
    },
    [goal, hours, level, settings],
  );

  useEffect(() => {
    if (!roadmap || !selected || requested.current.has(selected)) return;
    const node = roadmap.nodes.find((n) => n.id === selected);
    if (node) void loadPlan(node);
  }, [roadmap, selected, loadPlan]);

  /* ---------- progress ---------- */
  function flag(id: string, v: Status) {
    if (!roadmap) return;
    const n = roadmap.nodes.find((x) => x.id === id);
    if (!n) return;
    const was = status[id];
    setStatus((prev) => {
      const next = { ...prev };
      if (next[id] === v) delete next[id];
      else next[id] = v;
      return next;
    });
    if (was !== v) {
      say(v === "known" ? `Re-routed around ${n.label}` : `Cleared: ${n.label}`);
      if (v === "done") {
        const sameStage = roadmap.nodes.filter((m) => m.phase === n.phase);
        if (sameStage.every((m) => m.id === id || status[m.id])) {
          setTimeout(() => say(`Phase cleared: ${roadmap.phases[n.phase] ?? ""}`), 2700);
        }
      }
    }
    setSelected(null);
  }

  const pick = useCallback((id: string) => setSelected(id), []);

  const ids = useMemo(() => new Set(roadmap?.nodes.map((n) => n.id) ?? []), [roadmap]);
  const total = roadmap?.nodes.length ?? 0;
  const cleared = Object.keys(status).length;
  const remMonths = roadmap
    ? (roadmap.nodes.filter((n) => !status[n.id]).reduce((a, n) => a + n.weeks, 0) * 10) / hours / 4.33
    : 0;
  const fits = remMonths <= months;
  const node = roadmap?.nodes.find((n) => n.id === selected);

  function openChat(text?: string) {
    setChatOpen(true);
    if (text) setSeed((s) => ({ text, n: (s?.n ?? 0) + 1 }));
  }

  const getContext = (): ChatContext => ({
    goal,
    hours,
    months,
    level,
    settings,
    steps: roadmap
      ? roadmap.nodes.map((n) => ({
          label: n.label,
          status: status[n.id] ?? (isLocked(n, status, ids) ? "locked" : "available"),
        }))
      : [],
    selected: node?.label ?? null,
  });

  function exportJSON() {
    if (!roadmap) return;
    const blob = new Blob([JSON.stringify({ goal, roadmap, status }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dream-setu-roadmap.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function toggleTheme() {
    const dark =
      settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setSettings({ ...settings, theme: dark ? "light" : "dark" });
  }

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      say(ok);
    } catch {
      window.prompt("Copy this:", text);
    }
  }
  const shareLink = () =>
    roadmap && void copy(`${window.location.origin}${window.location.pathname}#share=${encodeShare(goal, roadmap)}`, "Share link copied");
  const copyChecklist = () => roadmap && void copy(toMarkdown(goal, roadmap, status, hours), "Checklist copied (Markdown)");

  // keyboard shortcuts always call the newest handlers
  act.current = {
    "/": () => document.getElementById("goal")?.focus(),
    c: () => (chatOpen ? setChatOpen(false) : openChat()),
    s: () => setSettingsOpen(true),
    t: toggleTheme,
    r: () => roadmap && void generate(true),
    e: exportJSON,
    l: shareLink,
    m: () => roadmap && setCompareOpen(true),
    "?": () => setHelpOpen(true),
    h: () => setHelpOpen(true),
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      const fn = act.current[e.key.toLowerCase()] ?? act.current[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const features: Feature[] = [
    { icon: "💬", label: "AI coach", hint: "Chat with 15 ready example questions", key: "c", onClick: () => act.current.c() },
    { icon: "↻", label: "Re-plan", hint: `Rebuild skipping cleared steps at ${hours} h/week`, key: "r", needsRoadmap: true, onClick: () => act.current.r() },
    { icon: "⚖", label: "Compare roles", hint: "Two dream jobs side by side", key: "m", needsRoadmap: true, onClick: () => act.current.m() },
    { icon: "🔗", label: "Share link", hint: "Copy a link anyone can open", key: "l", needsRoadmap: true, onClick: () => act.current.l() },
    { icon: "✅", label: "Checklist", hint: "Copy the plan as a Markdown checklist", needsRoadmap: true, onClick: copyChecklist },
    { icon: "⬇", label: "Export JSON", hint: "Download the full roadmap data", key: "e", needsRoadmap: true, onClick: exportJSON },
    { icon: "🖨", label: "Print / PDF", hint: "Print or save the map as PDF", needsRoadmap: true, onClick: () => window.print() },
    { icon: "⌨", label: "Commands", hint: "All shortcuts and functions", key: "?", onClick: () => setHelpOpen(true) },
  ];

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand"><i aria-hidden="true">✦</i>Dream Setu</div>
        <div className="grp">
          <button className="btn ghost" type="button" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">⚙ Settings</button>
          <span className={`aibadge ${ai?.ai ? "on" : "off"}`} role="status">{ai === null ? "● Checking AI…" : ai.ai ? `● AI live${ai.model ? ` · ${ai.model}` : ""}` : "● Demo mode (no AI key)"}</span>
          <button className="btn ghost" type="button" onClick={() => setHelpOpen(true)}>⌨ Commands</button>
          <button className="btn ghost" type="button" onClick={toggleTheme} aria-label="Switch light or dark theme">◐ Theme</button>
        </div>
      </div>

      {!roadmap && (
        <section className="hero">
          <h1>Name the exact job. We map the climb backwards.</h1>
          <p>
            Type a hyper-specific dream role and Dream Setu's AI reverse-engineers the skills, certifications,
            stepping-stone jobs and side projects into a map you can zoom, pan and re-route.
          </p>
          <div className="pills">
            <span style={{ "--c": "var(--p0)" } as React.CSSProperties}>Zoomable skill tree</span>
            <span style={{ "--c": "var(--p1)" } as React.CSSProperties}>Re-routes as you learn</span>
            <span style={{ "--c": "var(--p2)" } as React.CSSProperties}>Fits your time budget</span>
            <span style={{ "--c": "var(--p3)" } as React.CSSProperties}>AI career coach chat</span>
          </div>
        </section>
      )}

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void generate(false);
        }}
      >
        <div className="row">
          <label className="f grow">Dream job, as specific as you can
            <input id="goal" type="text" value={goal} maxLength={140} required onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Full Stack Developer at a climate tech startup" />
          </label>
          <label className="f">Hours per week
            <input type="number" min={1} max={80} value={hoursStr} list="hl" inputMode="numeric" style={{ width: 110 }} onChange={(e) => setHoursStr(e.target.value)} />
          </label>
          <datalist id="hl">{[3, 5, 8, 10, 12, 15, 20, 25, 30, 40].map((v) => <option key={v} value={v} />)}</datalist>
          <label className="f">Months available
            <input type="number" min={1} max={60} value={monthsStr} list="ml" inputMode="numeric" style={{ width: 110 }} onChange={(e) => setMonthsStr(e.target.value)} />
          </label>
          <datalist id="ml">{[1, 2, 3, 4, 6, 9, 12, 18, 24, 36].map((v) => <option key={v} value={v} />)}</datalist>
          <label className="f">Your level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Not sure</option><option>Complete beginner</option><option>Know the basics</option><option>Intermediate</option><option>Switching careers</option>
            </select>
          </label>
          <button className="btn" type="submit" disabled={loading}>{roadmap ? "Map a new path" : "Map my path"}</button>
        </div>
        <div className="chips" aria-label="Example goals">
          {EXAMPLE_GOALS.map((g) => (
            <button key={g} type="button" className="chip" onClick={() => setGoal(g)}>{g}</button>
          ))}
        </div>
        <small className="mut">The roadmap is written by an AI model each time. Check real job posts before you commit money to a course or certificate. We store nothing on a server; your progress stays in this browser.</small>
      </form>

      <FeatureBar items={features} hasRoadmap={Boolean(roadmap)} />

      {error && <div className="note on" role="alert">{error}</div>}
      {demo && roadmap && (
        <div className="note on" role="status">
          Demo data: no AI key is set, so this is a sample roadmap. Put <code>LLM_BASE_URL</code>, <code>LLM_API_KEY</code> and <code>LLM_MODEL</code> in <code>.env.local</code>, restart <code>npm run dev</code>, then press "Map a new path".
        </div>
      )}

      {roadmap && (
        <main className="app">
          <div>
            <div className="hud">
              <div className="stat"><b>{cleared}/{total}</b>steps cleared</div>
              <div className={`stat ${fits ? "ok" : "warn"}`}><b>≈ {remMonths.toFixed(1)} months</b>left at {hours} h/week</div>
              <div className={`stat ${fits ? "ok" : "warn"}`}><b>{fits ? "Fits" : `Over by ${(remMonths - months).toFixed(1)} mo`}</b>your {months}-month goal</div>
              <div className="bar" role="progressbar" aria-label="Roadmap progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((cleared / total) * 100)}>
                <i style={{ width: `${(cleared / total) * 100}%` }} />
              </div>
            </div>
            <div className="stage">
              <RoadmapMap roadmap={roadmap} status={status} selected={selected} onPick={pick} />
              <div className="legend">
                {roadmap.phases.map((p, i) => (
                  <span key={p + i}><b style={{ background: `var(--p${i % 5})`, color: `var(--p${i % 5})` }} />{p}</span>
                ))}
              </div>
            </div>
          </div>
          <aside className="panel" aria-live="polite">
            {node ? (
              <StepPanel
                roadmap={roadmap}
                node={node}
                status={status[node.id]}
                locked={isLocked(node, status, ids)}
                hours={hours}
                plan={plans[node.id]}
                onBack={() => setSelected(null)}
                onKnown={() => flag(node.id, "known")}
                onDone={() => flag(node.id, "done")}
                onAsk={() => openChat(`Give me a 1-week plan to learn "${node.label}" and tell me how I will know I am ready to move on.`)}
                onRetry={() => void loadPlan(node)}
              />
            ) : (
              <Overview roadmap={roadmap} hours={hours} onReplan={() => void generate(true)} onExport={exportJSON} market={market} />
            )}
          </aside>
        </main>
      )}

      {loading && (
        <div className="loadfix" role="status" aria-live="polite">
          <div><div className="orb" /><p>Mapping your path. This can take up to a minute…</p></div>
        </div>
      )}

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Compare open={compareOpen} onClose={() => setCompareOpen(false)} a={roadmap} goalA={goal} hours={hours} months={months} level={level} settings={settings} />
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          say("Settings saved");
          if (roadmap) setError("");
        }}
        onReset={() => {
          setSettings(DEFAULT_SETTINGS);
          say("Settings reset");
        }}
        onClose={() => setSettingsOpen(false)}
      />
      <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} getContext={getContext} seed={seed} />
      <button className="btn chatfab" type="button" onClick={() => (chatOpen ? setChatOpen(false) : openChat())} aria-expanded={chatOpen}>
        💬 Ask Dream Setu AI
      </button>
      <div className={`toast${toast ? " on" : ""}`} role="status">{toast}</div>
    </div>
  );
}

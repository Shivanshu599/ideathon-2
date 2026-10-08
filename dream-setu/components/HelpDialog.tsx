"use client";

import { useEffect, useRef } from "react";

export const SHORTCUTS: [string, string][] = [
  ["/", "Jump to the dream-job box"],
  ["c", "Open or close the AI coach chat"],
  ["s", "Open Settings"],
  ["t", "Switch light / dark theme"],
  ["r", "Re-plan the roadmap"],
  ["e", "Export JSON"],
  ["l", "Copy share link"],
  ["m", "Compare two roles"],
  ["? or h", "Show this Commands window"],
  ["Esc", "Close any window"],
];

const FUNCS: [string, string][] = [
  ["Map my path", "AI builds a roadmap for your exact job, hours and months."],
  ["Click a step", "Opens a weekend project, a repo to study, interview questions and a resource."],
  ["I already know this", "Re-routes the map around that step."],
  ["Mark complete", "Moves the step to base camp and updates time left."],
  ["Re-plan", "Builds a new plan that skips what you cleared."],
  ["Ask AI", "Coach chat with 15 ready example questions."],
  ["Compare roles", "Two dream jobs side by side: time, skills, overlap."],
  ["Share link / Checklist / JSON / Print", "Take your roadmap anywhere."],
];

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="ht">
      <h2 id="ht">Commands and functions</h2>
      <h3>Keyboard shortcuts</h3>
      <div className="kb">
        {SHORTCUTS.map(([k, d]) => (
          <div key={k}><kbd>{k}</kbd><span>{d}</span></div>
        ))}
      </div>
      <h3>What every function does</h3>
      <ul className="fl">
        {FUNCS.map(([a, b]) => (
          <li key={a}><b>{a}</b> - {b}</li>
        ))}
      </ul>
      <p className="small">Shortcuts work when you are not typing in a box.</p>
      <div className="acts"><button className="btn" type="button" onClick={onClose}>Close</button></div>
    </dialog>
  );
}

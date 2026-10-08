"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, type Settings } from "@/lib/types";

export default function SettingsDialog({
  open,
  settings,
  onSave,
  onReset,
  onClose,
}: {
  open: boolean;
  settings: Settings;
  onSave: (s: Settings) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [d, setD] = useState<Settings>(settings);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setD(settings);
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open, settings]);

  const text = (k: "bg" | "budget" | "region" | "lang") => ({
    value: d[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value }),
  });

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="dt">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...d, n: clamp(Math.round(Number(d.n)) || 15, 8, 24) });
          onClose();
        }}
      >
        <h2 id="dt">Settings</h2>
        <small className="mut">Saved on this device. Plan settings are used the next time the AI builds or re-plans your map.</small>
        <div className="g2">
          <label className="f full">Your background (degree, skills you have)
            <input type="text" maxLength={120} placeholder="e.g. B.Tech CSE 3rd year, know basic Python" {...text("bg")} />
          </label>
          <label className="f">Budget per month
            <input type="text" maxLength={40} list="bl" placeholder="e.g. Free only, ₹1000, $20" {...text("budget")} />
          </label>
          <datalist id="bl">
            <option value="Free resources only" /><option value="Up to ₹1000" /><option value="Up to ₹5000" /><option value="Up to $20" /><option value="Flexible" />
          </datalist>
          <label className="f">Where you are
            <input type="text" maxLength={60} placeholder="City or country" {...text("region")} />
          </label>
          <label className="f">Learning style
            <select value={d.style} onChange={(e) => setD({ ...d, style: e.target.value })}>
              <option>Mixed</option><option>Videos</option><option>Reading and docs</option><option>Hands-on projects</option><option>Guided courses</option>
            </select>
          </label>
          <label className="f">Resource language
            <input type="text" maxLength={30} list="ll" {...text("lang")} />
          </label>
          <datalist id="ll">
            <option value="English" /><option value="Hindi" /><option value="Hinglish" /><option value="Tamil" /><option value="Telugu" /><option value="Bengali" />
          </datalist>
          <label className="f">Employer type
            <select value={d.co} onChange={(e) => setD({ ...d, co: e.target.value })}>
              <option>Any</option><option>Startup</option><option>Product company</option><option>Service company / MNC</option><option>Government / PSU</option><option>Remote-first</option>
            </select>
          </label>
          <label className="f">Steps on the map (8 to 24)
            <input type="number" min={8} max={24} value={d.n} onChange={(e) => setD({ ...d, n: Number(e.target.value) })} />
          </label>
          <label className="f">Theme
            <select value={d.theme} onChange={(e) => setD({ ...d, theme: e.target.value as Settings["theme"] })}>
              <option value="auto">Match my device</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </label>
          <label className="f">Text size
            <select value={d.size} onChange={(e) => setD({ ...d, size: e.target.value as Settings["size"] })}>
              <option value="m">Normal</option><option value="l">Large</option>
            </select>
          </label>
          <label className="f chk full">
            <input type="checkbox" checked={d.calm} onChange={(e) => setD({ ...d, calm: e.target.checked })} /> Reduce motion and animations
          </label>
        </div>
        <div className="acts">
          <button className="btn" type="submit">Save settings</button>
          <button className="btn ghost" type="button" onClick={onReset}>Reset to defaults</button>
          <button className="btn ghost" type="button" onClick={onClose}>Close</button>
        </div>
      </form>
    </dialog>
  );
}

"use client";

export type Feature = {
  icon: string;
  label: string;
  hint: string;
  key?: string; // keyboard shortcut shown on the card
  onClick: () => void;
  needsRoadmap?: boolean;
};

/** Every function of the app as a big, labelled button, so nothing is hidden. */
export default function FeatureBar({ items, hasRoadmap }: { items: Feature[]; hasRoadmap: boolean }) {
  return (
    <section className="feats" aria-label="All actions">
      {items.map((f) => {
        const off = Boolean(f.needsRoadmap) && !hasRoadmap;
        return (
          <button key={f.label} type="button" className="feat" onClick={f.onClick} disabled={off} title={off ? "Create a roadmap first" : f.hint}>
            <span className="fi" aria-hidden="true">{f.icon}</span>
            <b>{f.label}{f.key && <kbd>{f.key}</kbd>}</b>
            <small>{off ? "Create a roadmap first" : f.hint}</small>
          </button>
        );
      })}
    </section>
  );
}

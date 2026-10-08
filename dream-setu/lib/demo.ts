import type { Roadmap, StepPlan } from "./schema";

// Shown only when no AI key is configured, and clearly labelled as demo data in the UI.
export const DEMO_ROADMAP: Roadmap = {
  title: "Frontend Engineer at a fintech startup (demo data)",
  summary: "Sample map shown because no AI key is set. Build the web basics, ship a data-heavy dashboard, then land a junior role.",
  phases: ["Foundations", "Core stack", "Proof of work", "Getting hired"],
  nodes: [
    { id: "html", label: "HTML, CSS & responsive layout", phase: 0, type: "skill", weeks: 3, desc: "Semantic markup, Flexbox/Grid and mobile-first design.", requires: [] },
    { id: "js", label: "Modern JavaScript (ES2023)", phase: 0, type: "skill", weeks: 5, desc: "Closures, async/await, modules and the DOM.", requires: [] },
    { id: "git", label: "Git & GitHub workflow", phase: 0, type: "skill", weeks: 2, desc: "Branches, pull requests and code review.", requires: [] },
    { id: "ts", label: "TypeScript", phase: 1, type: "skill", weeks: 4, desc: "Types, generics and typing API responses.", requires: ["js"] },
    { id: "react", label: "React & state management", phase: 1, type: "skill", weeks: 6, desc: "Hooks, context, data fetching and forms.", requires: ["html", "js"] },
    { id: "a11y", label: "Accessibility (IAAP WAS prep)", phase: 1, type: "cert", weeks: 3, desc: "WCAG 2.2 basics for compliant interfaces.", requires: ["html"] },
    { id: "test", label: "Testing with Vitest & Playwright", phase: 1, type: "skill", weeks: 3, desc: "Unit tests plus one end-to-end flow.", requires: ["react"] },
    { id: "dash", label: "Project: expense analytics dashboard", phase: 2, type: "project", weeks: 5, desc: "Charts, filters and CSV import.", requires: ["react", "ts", "git"] },
    { id: "intern", label: "Junior frontend / intern role", phase: 3, type: "role", weeks: 8, desc: "A first paid role. Apply with the dashboard and a clean GitHub.", requires: ["dash", "test", "a11y"] },
    { id: "target", label: "Frontend Engineer, fintech startup", phase: 3, type: "milestone", weeks: 6, desc: "Target role. Add payments-flow and security basics.", requires: ["intern"] },
  ],
  paths: [
    { who: "Self-taught, then startup intern", journey: ["Frontend course", "Open-source fixes", "Fintech internship", "Frontend Engineer"], tip: "Contributions to a real repo opened more doors than certificates." },
    { who: "Engineering student", journey: ["College projects", "Hackathon", "Campus placement", "Frontend Engineer"], tip: "A deployed project beat a long skills list." },
  ],
};

export const DEMO_STEP: StepPlan = {
  project: {
    title: "Demo weekend project",
    brief: "Add an AI key to get a project written for this exact step.",
    steps: ["Pick a tiny scope", "Build the core in one sitting", "Write a README with a screenshot"],
  },
  repo: { name: "Search GitHub for: this topic", why: "Study a few well-starred example repositories." },
  questions: [{ q: "Explain this step in your own words.", hint: "Use one concrete example." }],
  resource: null,
};

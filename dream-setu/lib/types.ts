export type Status = "known" | "done";

export type Settings = {
  bg: string;
  budget: string;
  region: string;
  style: string;
  lang: string;
  co: string;
  n: number;
  theme: "auto" | "light" | "dark";
  size: "m" | "l";
  calm: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  bg: "",
  budget: "",
  region: "",
  style: "Mixed",
  lang: "English",
  co: "Any",
  n: 15,
  theme: "auto",
  size: "m",
  calm: false,
};

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type ChatContext = {
  goal: string;
  hours: number;
  months: number;
  level: string;
  settings: Settings;
  steps: { label: string; status: string }[];
  selected: string | null;
};

export const TYPE_LABEL: Record<string, string> = {
  skill: "Skill",
  role: "Stepping-stone job",
  cert: "Certification",
  project: "Side project",
  milestone: "Target role",
};

export const TYPE_ICON: Record<string, string> = {
  skill: "◆",
  role: "★",
  cert: "✦",
  project: "⚒",
  milestone: "⚑",
};

export const PHASE_HEX = ["#a78bfa", "#22e3c4", "#ffc247", "#ff5c93", "#4da6ff"];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

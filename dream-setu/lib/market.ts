// Optional LIVE job-market data (Adzuna). If ADZUNA_APP_ID / ADZUNA_APP_KEY are not set, this is skipped.
export type Market = {
  source: string;
  count: number;
  titles: string[];
  skills: { name: string; n: number }[];
  salary: { min: number; max: number; cur: string } | null;
};

const SKILLS = [
  "Figma", "Sketch", "Adobe XD", "Prototyping", "User Research", "Wireframing", "Design System", "Accessibility",
  "Python", "SQL", "Excel", "Power BI", "Tableau", "Statistics", "Machine Learning", "JavaScript", "TypeScript",
  "React", "Next.js", "Node.js", "Java", "C++", "C#", "Unity", "Unreal", "Docker", "Kubernetes", "AWS", "Azure",
  "GCP", "Git", "REST", "GraphQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Linux", "CI/CD", "Agile", "Testing",
  "Django", "Flask", "Spring", "Tailwind", "HTML", "CSS", "Swift", "Kotlin", "Flutter", "Communication",
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CUR: Record<string, string> = { in: "₹", gb: "£", us: "$", au: "A$", ca: "C$", sg: "S$" };
const median = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);

export async function fetchMarket(goal: string): Promise<Market | null> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return null;
  const country = (process.env.ADZUNA_COUNTRY || "in").toLowerCase();
  const what = goal.split(/\s+(?:at|for|in)\s+/i)[0].slice(0, 80);
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${encodeURIComponent(id)}&app_key=${encodeURIComponent(key)}&results_per_page=30&what=${encodeURIComponent(what)}&content-type=application/json`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      count?: number;
      results?: { title?: string; description?: string; salary_min?: number; salary_max?: number }[];
    };
    const rows = d.results ?? [];
    if (!rows.length) return null;
    const text = rows.map((r) => `${r.title ?? ""} ${r.description ?? ""}`);
    const skills = SKILLS.map((name) => {
      const re = new RegExp(`(^|[^a-z0-9+#.])${esc(name)}($|[^a-z0-9+#])`, "i");
      return { name, n: text.filter((x) => re.test(x)).length };
    })
      .filter((s) => s.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 12);
    const mins = rows.map((r) => r.salary_min ?? 0).filter((v) => v > 0);
    const maxs = rows.map((r) => r.salary_max ?? 0).filter((v) => v > 0);
    return {
      source: `Adzuna (${country.toUpperCase()})`,
      count: d.count ?? rows.length,
      titles: Array.from(new Set(rows.map((r) => (r.title ?? "").trim()).filter(Boolean))).slice(0, 6),
      skills,
      salary: mins.length ? { min: median(mins), max: median(maxs.length ? maxs : mins), cur: CUR[country] ?? "" } : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export function marketPrompt(m: Market | null): string {
  if (!m) return "";
  const sk = m.skills.map((s) => `${s.name} (${s.n}/30 ads)`).join(", ");
  return `\nLIVE job-market data from ${m.source}, ${m.count} open ads. Common titles: ${m.titles.join("; ")}. Skills most requested: ${sk || "n/a"}. Base the skill nodes on these real demands.`;
}

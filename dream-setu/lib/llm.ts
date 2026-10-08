type Msg = { role: "system" | "user" | "assistant"; content: string };

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL);
}

async function call(messages: Msg[], json: boolean): Promise<string> {
  const base = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
  const body: Record<string, unknown> = {
    model: process.env.LLM_MODEL,
    messages,
    temperature: json ? 0.4 : 0.6,
  };
  if (json && process.env.LLM_JSON_MODE === "true") body.response_format = { type: "json_object" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`LLM request failed with status ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("LLM returned an empty reply");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function parseLoose(text: string): unknown {
  const s = text.replace(/```json|```/g, "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("No JSON found in reply");
  return JSON.parse(s.slice(a, b + 1));
}

export async function askJSON(prompt: string): Promise<unknown> {
  const text = await call(
    [
      { role: "system", content: "You reply with one valid JSON object only. No markdown, no commentary." },
      { role: "user", content: prompt },
    ],
    true,
  );
  return parseLoose(text);
}

export async function askChat(messages: Msg[]): Promise<string> {
  return call(messages, false);
}

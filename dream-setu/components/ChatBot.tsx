"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatContext, ChatMsg } from "@/lib/types";

export const EXAMPLES = [
  "Explain my roadmap in simple words",
  "What should I do this week?",
  "Which steps can I skip or shorten?",
  "Make a 4-week sprint plan",
  "Free resources for my first step",
  "Mock interview me for this role",
  "Which certificates are worth paying for?",
  "Which companies hire for this role?",
  "Expected salary and growth path",
  "Review my plan for gaps",
  "Resume bullet ideas for my projects",
  "Quiz me on the step I selected",
  "Compare this role with a similar one",
  "How do I stay consistent and motivated?",
  "What if I only have 5 hours a week?",
];

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const clean = line.replace(/^\s*[-*•]\s+/, "");
        const parts = clean.split(/\*\*(.+?)\*\*/g);
        return (
          <div key={i} className={bullet ? "bl" : undefined}>
            {bullet && "• "}
            {parts.map((p, j) => (j % 2 ? <b key={j}>{p}</b> : <span key={j}>{p}</span>))}
          </div>
        );
      })}
    </>
  );
}

export default function ChatBot({
  open,
  onClose,
  getContext,
  seed,
}: {
  open: boolean;
  onClose: () => void;
  getContext: () => ChatContext;
  seed: { text: string; n: number } | null;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [exOpen, setExOpen] = useState(true);
  const ref = useRef<ChatMsg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);
  const lastSeed = useRef(0);

  const push = (m: ChatMsg) => {
    ref.current = [...ref.current, m];
    setMsgs(ref.current);
  };

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setExOpen(false);
    setInput("");
    push({ role: "user", content: t });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: ref.current.slice(-8), context: getContext() }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      push({ role: "assistant", content: data.reply || data.error || "No reply. Try again." });
    } catch {
      push({ role: "assistant", content: "That did not go through. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (seed && seed.n !== lastSeed.current) {
      lastSeed.current = seed.n;
      void send(seed.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  useEffect(() => {
    if (open) inputEl.current?.focus();
  }, [open]);

  return (
    <section
      className="chat"
      hidden={!open}
      aria-label="Dream Setu AI chat"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <header>
        <b>Dream Setu AI</b>
        <small>You are chatting with an AI. It can be wrong.</small>
        <button type="button" onClick={onClose} aria-label="Close chat">✕</button>
      </header>
      <details open={exOpen} onToggle={(e) => setExOpen((e.currentTarget as HTMLDetailsElement).open)} className="exd">
        <summary>Example questions ({EXAMPLES.length})</summary>
        <div className="chips">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" className="chip" onClick={() => void send(x)} disabled={busy}>{x}</button>
          ))}
        </div>
      </details>
      <div className="msgs" aria-live="polite">
        <div className="m a">Hi, I'm an AI assistant for your roadmap. Pick an example above or type your own question.</div>
        {msgs.map((m, i) => (
          <div key={i} className={`m ${m.role === "user" ? "u" : "a"}`}>
            {m.role === "user" ? m.content : <Rich text={m.content} />}
          </div>
        ))}
        {busy && <div className="m a">Thinking…</div>}
        <div ref={end} />
      </div>
      <form
        className="cf"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          ref={inputEl}
          type="text"
          value={input}
          maxLength={400}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your path…"
          aria-label="Your message"
          autoComplete="off"
        />
        <button className="btn" type="submit" disabled={busy}>Send</button>
      </form>
    </section>
  );
}

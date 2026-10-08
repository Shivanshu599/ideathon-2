# Dream Setu

> Problem Statement 1: Reverse-Engineered Career Roadmapper
> Live URL: **[PASTE YOUR DEPLOYED URL HERE]**

<!-- Before you submit: replace every [BRACKETED] item, tick only what really works, then delete this comment. -->

## What it does

Dream Setu turns a hyper-specific dream job (for example "Full Stack Developer at a climate tech startup") into an interactive career map. An AI model breaks the goal into phases, skills, certifications, stepping-stone roles and side projects, and the app draws them as a zoomable, pannable skill tree. Clicking a step generates a tailored plan for it, and marking a skill as known re-routes the rest of the map. This repository is our entry for **Problem Statement 1**.

## Done / Left / Plan

**Done (works now)**
- [x] Goal input with hours per week, months available and level (typed manually)
- [x] AI-generated roadmap from the user's input (not a fixed list)
- [x] Interactive map: zoom, pan, click nodes, minimap
- [x] Actionable nodes: weekend project, repo to study, interview questions, resource
- [x] "Already known" and "Mark complete" re-route the map and update time left
- [x] Settings panel and AI coach chat with 15 example questions
- [x] "People who took this path" view, JSON export, light and dark themes
- [ ] Deployed and working on a phone (deploy to Vercel, then tick this)

**Left (next 16 hours)**
- [x] Compare two dream roles side by side (done)
- [x] Share roadmap as a link, Markdown checklist and print/PDF (done)

**Plan to finish**
| Hours | Work |
| --- | --- |
| 0 to 3 | Fix bugs from Round 1 feedback, confirm the live URL works without help |
| 3 to 8 | Polish, add more live data sources |
| 8 to 12 | Test on a phone, keyboard-only pass, bad-input pass |
| 12 to 14 | Final README, PPT, recorded backup demo |
| 14 to 16 | Freeze features, redeploy, check no keys are exposed |

## Architecture and why

```
Browser (Next.js App Router, React)
  ├─ Map: React Flow, custom layered layout (lib/layout.ts)
  ├─ State: React state + localStorage (progress, settings)
  └─ calls our own API routes only
        │
Next.js route handlers (server)
  ├─ POST /api/roadmap   build the roadmap JSON
  ├─ POST /api/step      plan for one step
  └─ POST /api/chat      coach chat
        │  AI key stays on the server (environment variable)
        ▼
[LLM provider and model name], OpenAI-compatible chat completions
```

- **Next.js route handlers:** one project and one deployment for the interface and the server code. The AI key is read on the server only, so it never reaches the browser.
- **[AI model/service]:** [one sentence on why you chose it].
- **Structured JSON plus zod validation:** the AI is asked for a fixed JSON shape and the reply is checked and cleaned (unique ids, valid prerequisites, no cycles) before it is drawn. Bad output shows a clear error instead of breaking the page.
- **React Flow:** gives zoom, pan, minimap and clickable nodes. Cleared steps move to a "base camp" column so the map re-routes.
- **No database:** progress and settings live in the browser (localStorage). No accounts, so we collect no personal data.
- **Rate limit:** a small in-memory limit on the API routes protects the AI key on the public demo.
- **Real-time approach:** not needed; each AI call is a normal request with a loading state.

## What we added

- Typed hours, months and level with live "fits your goal" feedback
- Settings panel that shapes the AI plan (budget, location, language, employer type, map size)
- AI coach chat with 15 example questions and an "Ask AI about this step" shortcut
- "People who took this path" cards, progress tracking, re-plan button, JSON export
- Light and dark themes, large text, reduce-motion option, keyboard-usable steps

## How to run it

Requirements: Node.js 20 or newer, VS Code.

```bash
git clone [REPO URL]
cd [REPO NAME]
npm install
cp .env.example .env.local      # Windows PowerShell: copy .env.example .env.local
# open .env.local and add your AI provider details
npm run dev
```

Open http://localhost:3000. Without an AI key the app shows clearly labelled demo data.

| Variable | Purpose |
| --- | --- |
| `LLM_BASE_URL` | Provider's OpenAI-compatible base URL |
| `LLM_API_KEY` | Key for the AI provider (server only) |
| `LLM_MODEL` | Model name to call |
| `LLM_JSON_MODE` | Optional, `true` if the provider supports JSON mode |

- **Live job data (optional):** set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` to ground roadmaps in real job ads.
- **Shortcuts:** `/` job box, `c` chat, `s` settings, `t` theme, `r` re-plan, `e` export, `l` share link, `m` compare, `?` help.
- **Test login:** none needed.
- **Live URL:** [PASTE YOUR DEPLOYED URL HERE]

## Tools and AI used

- **Libraries:** Next.js, React, TypeScript, React Flow (@xyflow/react), zod
- **AI model:** [provider and model name] for roadmap generation, step plans and the coach chat
- **Telling users it is AI:** the form says the roadmap is written by an AI model; the roadmap panel repeats it; the chat header says "You are chatting with an AI. It can be wrong."
- **Data:** the goal text and settings are sent to the AI provider to produce a plan. We store nothing on a server.

## Who it is for

College students and fresh graduates aiming for a specific role who only get generic advice. They come back to tick off steps, mark skills they have learned, and re-plan when their free time or goals change.

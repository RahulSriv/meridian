# Meridian

**AI-powered codebase onboarding guide generator.** Paste a GitHub repo URL — Meridian analyzes the actual code, commit history, and pull requests, and generates the onboarding guide a senior engineer would write for a new hire on day one.

🔗 **[meridian-sigma-six.vercel.app](https://meridian-sigma-six.vercel.app)** · [GitHub](https://github.com/RahulSriv/meridian)

---

## What it does

Meridian pulls a repo's README, file tree, manifest, setup files, recent commits, merged PRs, TODOs, and top-scoring source files via the GitHub API, then streams a 9-section guide grounded in that specific codebase — never generic advice.

| Section | What it covers |
|---|---|
| **Overview** | What the project is (and isn't) in plain English |
| **Architecture** | A narrative mental model of how the codebase is organized |
| **Reading order** | Which files to read first, and why, with time estimates |
| **Local setup** | Step-by-step setup derived from the repo's actual scripts |
| **Gotchas** | Sharp edges pulled from TODOs, FIXMEs, and git history |
| **Tech stack** | Key dependencies and why *this* repo uses them |
| **Ownership** | Who owns what, from git blame and commit patterns |
| **First PRs** | Concrete starter contributions grounded in real gaps |
| **Day 1 / Week 1 plan** | A checklist to get a new contributor oriented and shipping |

---

## Features

- **Streaming guide generation** — sections render progressively as the AI produces them
- **Free shared tier** — 3 analyses/day with no setup required
- **BYOK** — bring your own Gemini, Groq, Claude, or OpenAI key for unlimited analyses
- **Shareable links** — every guide gets a stateless, encoded URL
- **Export to Markdown** — download the full guide as a portable `.md` file
- **Freshness check** — detects when a repo has new commits since the guide was generated
- **Regenerate** — re-run analysis on demand
- **No account required** — API keys stored in browser localStorage only, never on the server

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS with full design token system |
| AI | Vercel AI SDK — Groq, Gemini, Claude, OpenAI |
| GitHub data | Octokit REST |
| State | Zustand |
| Validation | Zod |
| Deployment | Vercel (Hobby — free) |

---

## Getting started

### Prerequisites

- Node.js 18.17+ (developed and tested on 24.x)
- A free [Groq API key](https://console.groq.com/keys) for the shared tier
- A [GitHub personal access token](https://github.com/settings/tokens?type=beta) (fine-grained, Public Repositories read-only) — raises the GitHub API rate limit from 60/hr to 5000/hr and avoids intermittent 401s

### Local development

```bash
git clone https://github.com/RahulSriv/meridian.git
cd meridian
npm install
```

Copy the example env file and add your keys:

```bash
cp .env.example .env.local
```

```env
GROQ_API_KEY=gsk_...          # Required — powers the free shared tier
GITHUB_TOKEN=github_pat_...   # Required — GitHub API access for the analysis pipeline
GEMINI_API_KEY=AIza...        # Optional — only needed for the BYOK Gemini provider
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploying to Vercel

1. Fork this repo
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add `GROQ_API_KEY` and `GITHUB_TOKEN` in the Environment Variables section
4. Deploy

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq key for the shared free tier |
| `GITHUB_TOKEN` | Yes | GitHub API access for the analysis pipeline |
| `GEMINI_API_KEY` | No | Used only for the BYOK Gemini provider |
| `FREE_ANALYSES_PER_DAY` | No | Daily limit per IP on the shared tier (default: 3) |

API keys are **never** stored server-side. User-provided BYOK keys live in browser localStorage only. They are sent to the `/api/analyze` route over HTTPS and used to call the AI provider — they are never logged, cached, or written to any store.

---

## Project structure

```
meridian/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── guide/[id]/page.tsx       # Guide results page (server wrapper)
│   └── api/
│       ├── analyze/route.ts      # Streaming NDJSON analysis endpoint
│       └── freshness/route.ts    # Checks a guide's repo for new commits
├── components/
│   ├── landing/                  # Hero, RepoInput, HowItWorks, ExampleGuides
│   ├── guide/                    # GuideClient + all 9 section renderers
│   ├── layout/                   # Header, Footer
│   ├── provider/                 # BYOK provider picker
│   └── shared/                   # Button, Logo, GithubIcon
├── lib/
│   ├── github.ts                 # Octokit wrapper
│   ├── analyzer.ts               # 12-step analysis pipeline → RepoContext
│   ├── synthesizer.ts            # Prompt builder + streamObject call
│   ├── export.ts                 # Guide → Markdown serializer
│   ├── rate-limit.ts             # Per-IP daily rate limiter (shared tier)
│   └── types.ts                  # Shared TypeScript types
└── store/                        # Zustand stores (guide state, provider/key state)
```

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first.

---

## License

MIT © 2026 Rahul Srivastava

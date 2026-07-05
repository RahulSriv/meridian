# Meridian — Technical Design Document

**Version:** 1.0
**Status:** Draft

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript strict | Same as SpecLens — proven, Vercel-native, streaming support |
| Styling | Tailwind CSS with full token system | Rapid UI, consistent design system |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/groq`) | Multi-provider, streaming, Zod structured output |
| GitHub API | Octokit REST (`@octokit/rest`) | Official GitHub SDK, handles auth + rate limiting |
| State | Zustand | Lightweight, no boilerplate |
| Validation | Zod | Runtime type safety, used for AI structured output |
| Icons | lucide-react | Consistent with SpecLens |
| Deployment | Vercel free tier | Zero config, Edge runtime support |
| Node | 24.x | Same as SpecLens |

---

## 2. Architecture Overview

```
User enters repo URL
        ↓
  Landing Page (/)
        ↓
  POST /api/analyze
        ↓
  ┌─────────────────────────────┐
  │      Analysis Pipeline      │
  │  1. Validate + parse URL    │
  │  2. Fetch repo context      │
  │     (GitHub API)            │
  │  3. Sample key files        │
  │  4. Build AI context        │
  └─────────────────────────────┘
        ↓
  AI Synthesis (Gemini 2.0 Flash)
  Streamed section by section
        ↓
  Guide Page (/guide/[id])
  Renders sections as they stream
        ↓
  Shareable URL
```

---

## 3. File Structure

```
meridian/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css
│   ├── guide/
│   │   └── [id]/
│   │       └── page.tsx            # Guide results page
│   └── api/
│       ├── analyze/
│       │   └── route.ts            # Main analysis + streaming endpoint
│       └── github/
│           └── callback/
│               └── route.ts        # GitHub OAuth callback (v1 Should Have)
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── RepoInput.tsx
│   │   └── HowItWorks.tsx
│   ├── guide/
│   │   ├── GuideLayout.tsx
│   │   ├── GuideSection.tsx
│   │   ├── ReadingOrder.tsx
│   │   ├── SetupSteps.tsx
│   │   ├── Gotchas.tsx
│   │   ├── TechStack.tsx
│   │   ├── Ownership.tsx
│   │   ├── FirstPRs.tsx
│   │   ├── WeekOnePlan.tsx
│   │   └── FreshnessBar.tsx
│   └── shared/
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       ├── ExportButton.tsx
│       └── ShareButton.tsx
├── lib/
│   ├── github.ts                   # GitHub API client (Octokit wrapper)
│   ├── analyzer.ts                 # Repo context builder
│   ├── synthesizer.ts              # AI prompt + structured output
│   ├── ratelimit.ts                # IP-based rate limiting
│   └── types.ts                    # All shared TypeScript types
├── store/
│   └── useGuideStore.ts            # Zustand store
├── tailwind.config.ts
├── next.config.ts
└── .env.local                      # gitignored
```

---

## 4. Data Models

```typescript
// Input
type GuideRequest = {
  repoUrl: string
  apiKey?: string | null
  provider?: 'gemini' | 'groq' | 'claude' | 'openai'
}

// GitHub context assembled before AI call
type RepoContext = {
  owner: string
  repo: string
  description: string
  defaultBranch: string
  language: string
  stars: number
  fileTree: FileNode[]
  readme: string
  packageJson?: Record<string, unknown>
  setupFiles: SetupFile[]         // Makefile, docker-compose, .env.example
  recentCommits: Commit[]         // last 100
  recentPRs: PullRequest[]        // last 50 merged
  todos: TodoItem[]               // TODO/FIXME/HACK extracted from files
  keyFiles: KeyFile[]             // sampled file contents (top 20 by importance)
  blameData: BlameEntry[]         // git blame on entry points
}

// AI structured output (Zod schema)
type Guide = {
  id: string
  repoUrl: string
  repoName: string
  generatedAt: string
  commitSha: string               // for freshness tracking
  sections: {
    overview: {
      summary: string             // 3 paragraphs
      whatItIsNot: string         // clarifies scope
    }
    architecture: {
      narrative: string           // plain English explanation
      keyPatterns: string[]       // e.g. "uses event-driven architecture"
    }
    readingOrder: ReadingItem[]   // { file, reason, timeEstimate }
    localSetup: SetupStep[]       // { step, command?, note? }
    gotchas: Gotcha[]             // { title, description, severity, source }
    techStack: TechItem[]         // { name, version, whyUsedHere }
    ownership: OwnerArea[]        // { area, primaryOwner, files }
    firstPRs: PRSuggestion[]      // { title, description, area, difficulty }
    weekOnePlan: {
      day1: string[]
      week1: string[]
    }
  }
}

// Supporting types
type ReadingItem = {
  file: string
  reason: string
  timeEstimate: string            // "~5 min"
}

type SetupStep = {
  step: string
  command?: string
  note?: string
}

type Gotcha = {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  source: 'todo' | 'fixme' | 'git_history' | 'pr_comment'
}

type TechItem = {
  name: string
  version: string
  whyUsedHere: string             // specific to this repo, not generic docs
}
```

---

## 5. Analysis Pipeline (`lib/analyzer.ts`)

The pipeline runs entirely server-side via GitHub API — no git cloning required.

```
Step 1: Parse + validate GitHub URL → extract owner/repo
Step 2: Fetch repo metadata (description, language, stars, default branch)
Step 3: Fetch recursive file tree → score file importance
Step 4: Fetch README + any /docs files
Step 5: Fetch package.json / requirements.txt / Cargo.toml / go.mod
Step 6: Fetch Makefile / docker-compose.yml / .env.example
Step 7: Fetch last 100 commits (title, message, author, date)
Step 8: Fetch last 50 merged PRs (title, body, labels)
Step 9: Sample top 20 files by importance score → fetch contents
Step 10: Extract TODO/FIXME/HACK/NOTE from sampled files
Step 11: Fetch git blame for entry point files (e.g. index.ts, main.py)
Step 12: Assemble RepoContext object → pass to synthesizer
```

**File Importance Scoring** (for selecting which 20 files to read):
- Entry points (index.ts, main.py, app.py, server.js) → highest
- Config files (tsconfig, eslint, jest.config) → high
- Files with most commits in last 90 days → high
- Files with TODO/FIXME density → high
- Test files (*.test.ts, *.spec.py) → medium
- Deeply nested utility files → low

---

## 6. AI Synthesis (`lib/synthesizer.ts`)

**Model:** Gemini 2.0 Flash (free tier, shared server-side key)
**SDK:** Vercel AI SDK `streamObject` with Zod schema

**Strategy:** Single large prompt with full repo context → streamed structured output section by section. Each section streams independently so the UI can render progressively.

**System prompt approach:**
```
You are a senior engineer who has spent 3 months working on this codebase.
A new developer is joining the team today. Write them a comprehensive onboarding guide.
Be specific to THIS codebase — never give generic advice.
Use plain English. Avoid jargon. Be opinionated about what matters.
[repo context injected here]
```

**Context budget management:**
- README: max 2000 tokens
- File tree: max 1000 tokens (compressed)
- Commits: max 1500 tokens (titles only if hitting limit)
- PRs: max 1500 tokens (titles + first 200 chars of body)
- Key files: max 500 tokens each, 20 files max = 10,000 tokens
- TODOs: max 1000 tokens
- Total target: ~20,000 tokens input

**Rate limiting:**
- Free tier: 3 analyses per IP per day
- Checked via in-memory store (resets on server restart) or Vercel KV if needed
- BYOK bypasses rate limit

---

## 7. API Contract

### `POST /api/analyze`

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "apiKey": "optional-user-key",
  "provider": "gemini"
}
```

**Response:** Server-Sent Events stream (Vercel AI SDK format)

Each event: `{ type: "section", name: "overview" | "architecture" | ..., content: "..." }`

**Error responses:**
- `400` — Invalid GitHub URL
- `404` — Repo not found or private
- `429` — Rate limit exceeded (free tier)
- `500` — Analysis failed

---

## 8. Shareable Links

**Approach:** Guide is generated on-demand and cached client-side in Zustand. Shareable link encodes the repo URL.

- URL format: `/guide/[base64-encoded-repo-url]`
- On direct link access: triggers analysis automatically
- No server-side storage — guide regenerates on each visit
- Freshness indicator shows if the guide is potentially stale (commits since generation)

---

## 9. Frontend Pages

### Landing Page (`/`)
- Hero: product name, tagline, repo URL input
- How it works: 3-step explainer
- Example guides: links to pre-generated guides for well-known repos
- BYOK: expandable panel for API key input + provider selection

### Guide Page (`/guide/[id]`)
- Sticky sidebar navigation (section links)
- Sections stream in one by one with loading skeletons
- Each section collapsible
- Freshness bar at top
- Share button (copies URL)
- Export button (downloads .md)
- "Regenerate" button

---

## 10. Architecture Decision Records (ADRs)

**ADR-001: GitHub API over git clone**
- Decision: Use GitHub REST API for all data fetching, never clone repos
- Reason: No server storage needed, works in serverless/edge, no security concerns with arbitrary repo code
- Tradeoff: GitHub API rate limits (60/hr unauth, 5000/hr auth). Mitigated by optional GitHub token.

**ADR-002: Gemini 2.0 Flash as free model**
- Decision: Use Gemini 2.0 Flash via shared server-side key for free tier
- Reason: Large context window (1M tokens), fast, free, same as SpecLens
- Tradeoff: Shared key means shared rate limit. Mitigated by IP-based 3/day limit.

**ADR-003: Stateless — no database**
- Decision: No persistent storage. Guides regenerate on demand.
- Reason: $0 operating cost, no GDPR/privacy concerns, simpler architecture
- Tradeoff: No guide history, regeneration takes time. Freshness indicator manages expectations.

**ADR-004: Streaming response**
- Decision: Stream guide sections as they generate using Vercel AI SDK `streamObject`
- Reason: 30-90 second generation time requires progressive rendering for good UX
- Tradeoff: More complex frontend state management

**ADR-005: No git cloning — file sampling strategy**
- Decision: Fetch max 20 files by importance score, not full codebase
- Reason: GitHub API file size limits, context window constraints, speed
- Tradeoff: May miss important files in large codebases. Importance scoring mitigates this.

---

## 11. Environment Variables

```bash
# .env.local (gitignored)
GEMINI_API_KEY=              # Shared server-side key for free tier
GITHUB_TOKEN=                # Optional — increases API rate limit to 5000/hr
NEXTAUTH_SECRET=             # For GitHub OAuth (Should Have)
NEXTAUTH_URL=                # For GitHub OAuth (Should Have)
```

---

## 12. Build Phases

| Phase | Session | Scope |
|---|---|---|
| 1 | Session 1 (this) | PRD + TDD (planning) |
| 2 | Session 2 | Project setup + Next.js scaffold + Tailwind tokens + landing page UI |
| 3 | Session 3 | GitHub API integration + analysis pipeline (`lib/github.ts`, `lib/analyzer.ts`) |
| 4 | Session 4 | AI synthesis layer — prompt design, structured output, streaming (`lib/synthesizer.ts`) |
| 5 | Session 5 | Guide results page — streaming UI, all sections, sidebar navigation |
| 6 | Session 6 | Export, shareable links, freshness indicator, polish, deploy to Vercel |

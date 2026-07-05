# Meridian — Session State

> ALWAYS read this file at the start of every session before doing any work.
> Update it in real-time during a session, not just at the end.

---

## Current Status

**Active Phase:** Phase 6 — features + known bugs complete (share, export, freshness, regenerate, schema-strictness fix); deploy pending
**Next Session:** Push to GitHub → update placeholder repo URLs → deploy to Vercel
**Last Updated:** 2026-07-05

---

## Phase Progress

| Phase | Session | Scope | Status |
|---|---|---|---|
| 1 | Session 1 | PRD + TDD (planning) | ✅ Complete |
| 2 | Session 2 | Project setup + scaffold + landing page UI | ✅ Complete |
| 3 | Session 3 | GitHub API + analysis pipeline | ✅ Complete |
| 4 | Session 4 | AI synthesis + streaming | ✅ Complete |
| 5 | Session 5 | Guide results page + all sections | ✅ Complete |
| 6 | Session 6 | Export, shareable links, freshness, regenerate | ✅ Complete (deploy pending) |

---

## What Exists Now

```
meridian/
├── app/
│   ├── page.tsx                    ✅ Landing page (Hero + HowItWorks + ExampleGuides)
│   ├── layout.tsx                  ✅ Root layout (fonts, metadata)
│   ├── globals.css                 ✅ Design tokens + animations
│   ├── icon.svg                    ✅ Meridian favicon (globe + meridian line)
│   ├── guide/
│   │   └── [id]/
│   │       └── page.tsx            ✅ Server wrapper → decodes repoUrl → renders GuideClient
│   └── api/
│       └── analyze/
│           └── route.ts            ✅ POST endpoint — streams NDJSON StreamEvents
├── components/
│   ├── landing/
│   │   ├── Hero.tsx                ✅ Tagline, grid bg, meridian-line draw animation
│   │   ├── RepoInput.tsx           ✅ Validates URL, routes to /guide/[id]
│   │   ├── HowItWorks.tsx          ✅ 3-step explainer
│   │   └── ExampleGuides.tsx       ✅ Links to hono, flask, fastapi, tinygrad
│   ├── guide/
│   │   ├── GuideClient.tsx         ✅ Full guide page: analyzing/streaming/complete/error phases
│   │   ├── GuideLayout.tsx         ✅ Two-column layout + sticky sidebar nav
│   │   ├── GuideSection.tsx        ✅ Collapsible section wrapper + shimmer skeleton
│   │   ├── OverviewSection.tsx     ✅ Summary + whatItIsNot
│   │   ├── ArchitectureSection.tsx ✅ Narrative + key patterns
│   │   ├── ReadingOrderSection.tsx ✅ Numbered file list + time estimates
│   │   ├── SetupSection.tsx        ✅ Numbered steps + code blocks
│   │   ├── GotchasSection.tsx      ✅ Severity badges + source tags
│   │   ├── TechStackSection.tsx    ✅ Dep cards with whyUsedHere
│   │   ├── OwnershipSection.tsx    ✅ Area/owner/files layout
│   │   ├── FirstPRsSection.tsx     ✅ PR cards with difficulty badges
│   │   └── WeekOnePlanSection.tsx  ✅ Day 1 + Week 1 checklists
│   ├── layout/
│   │   ├── Header.tsx              ✅ Sticky, BYOK button, loads store from localStorage
│   │   └── Footer.tsx              ✅ Logo + links
│   ├── provider/
│   │   └── ProviderPanel.tsx       ✅ Drawer: provider selection + API key input + localStorage
│   └── shared/
│       ├── Button.tsx              ✅ primary/secondary/ghost, loading state, teal glow
│       └── Logo.tsx                ✅ SVG globe mark + wordmark
├── lib/
│   ├── github.ts                   ✅ Octokit wrapper (meta, tree, content, commits, PRs, blame)
│   ├── analyzer.ts                 ✅ 12-step pipeline → RepoContext (parallel fetching, batched)
│   ├── synthesizer.ts              ✅ buildPrompt + streamGuide (Vercel AI SDK streamObject)
│   ├── types.ts                    ✅ All shared TypeScript types (Guide, RepoContext, etc.)
│   └── utils.ts                    ✅ cn(), parseRepoUrl(), encodeGuideId(), decodeGuideId()
├── store/
│   ├── useProviderStore.ts         ✅ Zustand — provider + API key + localStorage persistence
│   └── useGuideStore.ts            ✅ Zustand — guide status + streaming event applicator + setComplete
├── docs/
│   ├── PRD.md                      ✅ Complete
│   ├── TDD.md                      ✅ Complete
│   └── session-state.md            ✅ This file
├── package.json                    ✅ All deps installed (octokit, ai-sdk, zustand, zod, etc.)
├── tailwind.config.ts              ✅ Meridian teal token system
├── tsconfig.json                   ✅ Strict, @/* maps to root
└── .env.example                    ✅ GEMINI_API_KEY, GITHUB_TOKEN, FREE_ANALYSES_PER_DAY
```

---

## Session 4 — Complete ✅

Built:
- `lib/synthesizer.ts` — Zod schema (`GuideSectionsSchema`) mirroring `GuideSections` type; `buildPrompt()` with context budgets (README 8k chars, tree 4k, commits 6k, PRs 6k, key files 2k each, TODOs 4k); `getModel()` factory for all 4 BYOK providers + shared Gemini; `streamGuide()` calls `streamObject` from Vercel AI SDK
- `app/api/analyze/route.ts` — Replaced JSON stub with NDJSON streaming `ReadableStream`; emits `status` events during context build and AI generation; drains `partialObjectStream` for section-start progress events; emits all 9 `section` events from final validated object; emits `meta` event; error handling emits `error` event
- `store/useGuideStore.ts` — Added `setComplete()` action
- `components/guide/GuideClient.tsx` — Full rewrite: uses `useGuideStore` + `useProviderStore`; reads NDJSON stream line-by-line; calls `applyEvent` for each event; renders 4 phases: analyzing (spinner + stage), streaming (section checklist), complete (overview preview + section grid), error

**Streaming architecture:** NDJSON over a single `fetch` with `ReadableStream` reader. Route emits one JSON event per line. Client buffers partial lines across chunks. Sections emit sequentially when all 9 are generated.

**Note for Session 5:** `.env.local` must exist with `GEMINI_API_KEY` (starts `AIza`) and `GITHUB_TOKEN` before testing the full pipeline.

---

## Session 5 — Complete ✅

Built:
- `components/guide/GuideLayout.tsx` — two-column layout: sticky sidebar with section nav (CheckCircle2 for arrived, Circle for pending) + main content area. Repo name header + back link.
- `components/guide/GuideSection.tsx` — collapsible section wrapper (chevron toggle, defaults open). Shows shimmer skeleton when `isLoaded=false`, renders children when loaded. Anchor id for sidebar nav.
- `components/guide/OverviewSection.tsx` — summary paragraphs + whatItIsNot italic callout box
- `components/guide/ArchitectureSection.tsx` — narrative + key patterns bullet list with teal accent dots
- `components/guide/ReadingOrderSection.tsx` — numbered list: file (mono), reason, clock + timeEstimate badge
- `components/guide/SetupSection.tsx` — numbered steps with teal circle counters; command in `<pre><code>` block; optional note italicized
- `components/guide/GotchasSection.tsx` — cards with severity badge (uses `severity-*` token colors) + source tag
- `components/guide/TechStackSection.tsx` — 2-col grid of cards: name + version chip + whyUsedHere
- `components/guide/OwnershipSection.tsx` — cards: area + primaryOwner + file chips (FileText icon, mono font)
- `components/guide/FirstPRsSection.tsx` — cards with difficulty badge (uses `difficulty-*` token colors) + area label
- `components/guide/WeekOnePlanSection.tsx` — two-panel layout: Day 1 checklist + Week 1 checklist (CheckSquare icons)
- `components/guide/GuideClient.tsx` — full rewrite: streaming and complete phases both use `GuideResultsView` which renders `GuideLayout` + all 9 `GuideSection` wrappers. Streaming indicator (animated loader) shown during streaming. "All sections generated" tick shown on complete.

**Layout:** `max-w-5xl` (widened from Session 4's `max-w-4xl`) to accommodate two-column guide layout. Sidebar `hidden lg:block` — mobile gets full-width content.

**Note for Session 6:** `.env.local` must exist with `GEMINI_API_KEY` + `GITHUB_TOKEN` for full pipeline test.

---

## Session 6 — Complete ✅ (deploy pending)

Built:
- `lib/export.ts` — `guideToMarkdown(guide)` serialises all 9 sections to portable Markdown (title + metadata block, severity/difficulty tags, checklists for Day1/Week1, fenced bash for setup commands). `guideFilename()` → `owner-repo-onboarding.md`. Dependency-free so it runs in the browser.
- `components/guide/GuideActions.tsx` — Share (copies `window.location.href`, clipboard API + textarea fallback, "Copied" confirmation), Export (Blob download of the `.md`, disabled until complete), Regenerate (ghost button, disabled until complete).
- `app/api/freshness/route.ts` — POST `{ repoUrl, commitSha }` → compares stored SHA against default-branch tip via `compareCommitsWithBasehead`, returns `{ stale, newCommits, latestSha }`. Uses server `GITHUB_TOKEN` only (never the client AI key). Best-effort: any failure (force-push 404, rate limit) returns `{ unknown: true }` rather than erroring.
- `lib/github.ts` — added `fetchCommitDelta()` helper.
- `components/guide/FreshnessBar.tsx` — auto-checks on mount when complete; states: checking / up-to-date / N new commits (amber, with inline Regenerate) / unavailable. Shows relative generated-time + short SHA linking to the GitHub commit.
- `components/guide/GuideLayout.tsx` — new optional `actions` slot in the header row (flex-wrap, right-aligned).
- `components/guide/GuideClient.tsx` — regenerate mechanism: `reloadKey` state + `fetchedKey` ref (replaces `didFetch` boolean) so Regenerate forces a fresh run while still guarding Strict Mode double-invoke. Wires `GuideActions` into the layout header and `FreshnessBar` at the top of the content (complete state only).
- `components/shared/GithubIcon.tsx` — inline octocat SVG (lucide-react 1.20.0 has no `Github` export). Used in Header + Footer.

Verified: `tsc --noEmit` clean, `next lint` clean (only pre-existing font warning), `next build` succeeds — `/api/freshness` route present, guide page 7.5 kB.

**Deploy (remaining):** needs user action — `vercel` CLI login or connect the GitHub repo in the Vercel dashboard, then set env vars `GEMINI_API_KEY` + `GITHUB_TOKEN` in Vercel project settings. No `vercel.json` needed (Next.js is zero-config on Vercel).

---

## Session 6 — Entry Checklist

Read before starting Session 6:
- [ ] `docs/TDD.md` — full doc, especially §8 (guide page), §9 (frontend pages)
- [ ] `docs/session-state.md` — this file
- [ ] `components/guide/GuideClient.tsx` — current complete view to add share/export buttons
- [ ] `app/guide/[id]/page.tsx` — server wrapper
- [ ] `lib/utils.ts` — `encodeGuideId`, `decodeGuideId`

Session 6 goal: Export, shareable links, freshness indicator, polish, deploy
- Share button — copies current URL to clipboard
- Export button — downloads guide as formatted `.md` file
- Freshness indicator — shows if the repo has new commits since guide was generated (needs GitHub API call with stored `commitSha`)
- "Regenerate" button — clears guide store and re-triggers analysis
- Final polish pass (accessibility, mobile, spacing)
- Deploy to Vercel

---

## Key Decisions (Do Not Revisit)

| Decision | Choice | Reason |
|---|---|---|
| Product name | Meridian | Premium, navigational, user's instinct |
| Tagline | "Your reference line for any codebase." | Exclusively Meridian's |
| Free model | Gemini 2.0 Flash | Large context window, free, proven in SpecLens |
| BYOK providers | Gemini, Groq, Claude, OpenAI | Same as SpecLens |
| Data fetching | GitHub API only (no git clone) | Serverless-compatible, no storage needed |
| Storage | None — fully stateless | $0 cost, no privacy concerns |
| Stack | Next.js 14 + TypeScript + Tailwind + Vercel AI SDK | Same as SpecLens |
| Rate limit | 3 analyses/day per IP (free tier) | Prevents abuse of shared key |
| Guide URL format | `/guide/[base64url-encoded-repo-url]` | Stateless, shareable, no DB |
| `@/*` alias | Maps to root (`./*`) not `./src/*` | app/ is at root per TDD |
| Streaming format | NDJSON (`ReadableStream` body, one JSON event per line) | Simple, no SSE overhead, works with fetch ReadableStream |
| Section completion signal | `setComplete()` called by client after reader closes | Server naturally ends stream; no explicit "complete" event needed |

---

## Design System

- **Accent:** `#22D3BF` (navigational teal — the meridian line)
- **Background base:** `#070B12` (deep midnight)
- **Font:** Inter (sans) + JetBrains Mono (mono)
- **Grid backdrop:** CSS mask-gradient over fine grid lines (`.meridian-grid`)
- **Signature animation:** `animate-draw-line` — horizontal line draws left-to-right on hero load

---

## Known Issues / Bugs

- ESLint warning in `app/layout.tsx`: `@next/next/no-page-custom-font` — suppressed with `eslint-disable-next-line`, acceptable for Google Fonts approach.
- **BYOK GitHub auth bug — FIXED (2026-06-21):** `app/api/analyze/route.ts` was calling `buildRepoContext(repoUrl, apiKey ?? undefined)`, feeding the AI provider key into the *GitHub token* slot, so BYOK requests 401'd on the first GitHub call. Fixed by calling `buildRepoContext(repoUrl)` — GitHub now always uses server `GITHUB_TOKEN` (via `makeOctokit` env fallback), and `apiKey` reaches only the AI model via `streamGuide` → `getModel`. Verified with `tsc --noEmit`.

## Free Tier Provider Switch — Gemini → Groq (2026-06-21)

The free/shared tier now runs on **Groq `meta-llama/llama-4-scout-17b-16e-instruct`** instead of Gemini 2.0 Flash. Driven by: the available Gemini key had `limit: 0` free-tier quota, and Groq's free tier is genuinely $0.

Getting Groq working required three fixes in `lib/synthesizer.ts`:
1. **Model must support `json_schema` structured output.** `llama-3.3-70b-versatile` does NOT (400: "model does not support response format json_schema") — this also means **BYOK Groq was broken the same way**. Both free tier and BYOK Groq now use `GROQ_MODEL = meta-llama/llama-4-scout-17b-16e-instruct`.
2. **Strict schema — no optional fields.** Groq's strict json_schema mode requires every property in `required`. Changed `localSetup` items' `command`/`note` from `.optional()` to `.nullable()` (renderers already treat null as absent via truthiness checks). Only two optionals existed in the whole schema.
3. **TPM headroom.** Free-tier TPM by model: gpt-oss-20b/120b = 8k, qwen3-32b = 6k, llama-3.3-70b = 12k (no json_schema), **llama-4-scout = 30k**. A medium repo prompt (~13k tokens) exceeds 8k, so llama-4-scout (30k, json_schema-capable) is the only viable free option.

Tested OK end-to-end (server-side Groq key, no BYOK):
- `octocat/Hello-World` → 9 sections in 4.1s
- `pallets/flask` (~13k token prompt) → 9 sections in 8.9s, content is flask-specific (Werkzeug/Jinja/Click)

⚠️ **Known limitation:** very large repos can still exceed 30k TPM → hard 429. If that becomes common, trim the context budget in `buildPrompt()` or document BYOK as the path for large repos.

### Hang bug — FIXED (2026-06-21)

`streamObject` swallows streaming errors by default, so failed AI calls hung `/api/analyze` for the full client timeout (~180s). Fixed:
- `lib/synthesizer.ts` — `streamGuide()` now takes an `onError` callback, wired to `streamObject`'s `onError`.
- `app/api/analyze/route.ts` — captures the AI error via onError into `aiError`, breaks the partial-stream drain, and `throw`s it BEFORE awaiting `result.object` (which was where it hung). Added `phase` tracking ("github" | "ai"), an `extractMessage()` helper (AI errors arrive as plain objects, not Error instances — `instanceof Error` was failing), `toUserMessage(message, phase)` for friendly phase-scoped messages, and `console.error` logging of the raw error.

Verified fail-fast (all on :3000):
- BYOK bogus key → 4.8s, "The AI provider rejected the API key…"
- nonexistent repo (github phase) → 0.35s, "Repository not found or private."
- schema-mismatch error → 3.4s (clean error path, no hang)

### Schema strictness issue — FIXED (2026-07-05)

Groq strict json_schema + llama-4-scout was failing generation for repos missing certain data. octocat/Hello-World (no versioned deps) → model emitted `techStack[].version = null`, but schema required `version: string`:
`'/techStack/0/version' ... expected string, but got null`. flask worked fine (it HAS versioned deps).

Fixed in `lib/synthesizer.ts`: `techStack.version` and `ownership.primaryOwner` changed from `z.string()` to `z.string().nullable()`, same pattern as the `localSetup.command/note` fix. Updated the two renderers that assumed these were always present: `lib/export.ts` (ownership case now omits the "Primary owner" line when null) and `components/guide/OwnershipSection.tsx` (owner badge now conditionally rendered).

Verified live end-to-end: `octocat/Hello-World` now generates all 9 sections successfully; `pallets/flask` re-tested as a regression check, still works. `tsc --noEmit` clean.

## Session 7 — Complete ✅ (2026-07-05)

- Discovered `GITHUB_TOKEN` in `.env.local` had gone bad (`401 Bad credentials` on every GitHub API call, regardless of repo) — user generated a fresh fine-grained PAT (Public Repositories, read-only) and swapped it in.
- Fixed misleading error messaging: `toUserMessage()` in `app/api/analyze/route.ts` now maps GitHub-phase 401s to "Something went wrong fetching this repository. Please try again in a moment." instead of the generic (and wrong) "check the URL" message.
- Fixed the schema-strictness issue above.
- **Fixed: binary files corrupting the AI prompt.** User tested `RahulSriv/art-interpretation-system-multimodal-rag` (a small repo, 27 files) and got a generic "Guide generation failed" with no useful detail from Groq. Root cause: `lib/analyzer.ts`'s key-file scoring/selection had no binary-file filter — on small repos the "top 20 by score" net is wide enough to catch `.png` screenshots (up to 569KB), `.pkl` vector/index files, `.jpg`, and compiled `.pyc`, all decoded as UTF-8 text by `fetchFileContent` (which decodes any file's base64 content as text unconditionally). The garbled binary-as-text content flooded the prompt and broke Groq's structured JSON generation. Fixed by adding a `BINARY_EXT_RE` denylist (images, pickles, compiled bytecode, archives, fonts, media, etc.) to the same filter step as the existing `node_modules`/`.git` skip in `buildRepoContext()`, and added `__pycache__` to that skip list. General fix, not repo-specific — any repo with binary assets among its top-scoring files was at risk. Verified live: the RAG repo now generates all 9 sections; `octocat/Hello-World` and `pallets/flask` re-confirmed unaffected. `tsc --noEmit` clean.
- **Fixed: stream controller crash on early disconnect.** A Next dev-server worker crash (`Jest worker encountered 2 child process exceptions`) left an in-flight request's `ReadableStream` torn down mid-generation; the route then threw `TypeError [ERR_INVALID_STATE]: Invalid state: Controller is already closed` trying to `emit()`/`close()` afterward, and the client never got a completion or error event (looked like infinite loading). Hardened `app/api/analyze/route.ts`: `emit()` now no-ops after the controller is closed (tracked via a `closed` flag, set on a caught enqueue failure), the `finally` block guards against double-`close()`, and the stream got an explicit `cancel()` handler. Defensive fix — doesn't matter what causes the early teardown (client abort, HMR, dev-server hiccup), the handler can no longer crash because of it.
- **Added: bounded retry for Groq schema-validation flakiness.** Groq's strict `json_schema` mode occasionally emits a completion that fails our schema validation — empty output, an enum value outside the allowed set — as sampling variance rather than a deterministic prompt problem (the exact same prompt/context succeeds on retry). `app/api/analyze/route.ts`'s AI phase now retries up to 3 attempts when the error matches "does not match the expected schema" / "failed to generate JSON", emitting a `"Retrying guide generation..."` status event between attempts. Note: this does NOT help if the shared free-tier Groq key's per-minute token budget (30k TPM) is already exhausted from heavy request volume in a short window — that's a capacity limit, not sampling noise, and retries within the same minute will also fail. Space out repeated manual tests against the shared key.
- **Fixed (real root cause of "loading forever" in local dev): React Strict Mode double-invoke bug in `GuideClient.tsx`.** This is why the user could not get a single successful run in the browser even when the exact same request succeeded via `curl` — curl bypasses the React frontend entirely, so it never hit this bug. Next.js dev enables React Strict Mode by default, which invokes effects mount → cleanup → mount again. The old code used a `fetchedKey` ref to skip the second invocation, assuming the first invocation's request would complete — but the first invocation's cleanup runs almost immediately, setting `cancelled = true` on the *one real request*, and the stream-reading loop bails out (`reader.cancel(); return;`) as soon as `cancelled` is checked after the very first chunk arrives. Meanwhile the guard prevented the second (real, never-cancelled) invocation from starting a new request at all. Net effect: the single request that ever ran was always killed after ~1 event, every time, regardless of repo or Groq behavior — store got stuck in `analyzing` status forever. Fixed by removing the `fetchedKey` skip entirely and giving each effect invocation its own `AbortController` + `cancelled` closure: the first (Strict Mode phantom) invocation's request now aborts cleanly via `controller.abort()` in the cleanup, while the second invocation proceeds normally to completion. Standard, correct pattern for effects with async work under Strict Mode. Verified: user confirmed it works now in the browser.

**Dev server:** currently running on http://localhost:3000 (background); env loaded from `.env.local` (fresh GITHUB_TOKEN + GROQ_API_KEY set).

**Next session:** Push to GitHub → update placeholder repo URLs (`components/layout/Header.tsx`, `components/layout/Footer.tsx`) → deploy to Vercel (see Pending Follow-ups below).

## Pending Follow-ups

- **After pushing to GitHub:** update placeholder `https://github.com` links to the real repo URL in `components/layout/Header.tsx` and `components/layout/Footer.tsx`. Also consider adding the GitHub mark to the `ExampleGuides.tsx` repo cards.
- GitHub mark icon added in `components/shared/GithubIcon.tsx` (lucide-react has no `Github` export) — reuse it for the above.

---

## Notes for Future Sessions

- Node version: 24.x
- No shadcn CLI — all components built from scratch
- lucide-react: no `Github` icon — use `GitFork` instead (SpecLens lesson)
- Gemini key: must start with `AIza` — get from https://aistudio.google.com/apikey
- GitHub API rate limit: 60 req/hr unauthenticated. Set `GITHUB_TOKEN` in `.env.local` immediately to get 5000/hr
- `encodeGuideId` / `decodeGuideId` in `lib/utils.ts` are isomorphic (browser + Node)
- `@ai-sdk/google` uses `GOOGLE_GENERATIVE_AI_API_KEY` as default env var, but `synthesizer.ts` explicitly passes `process.env.GEMINI_API_KEY` via `createGoogleGenerativeAI` — so `.env.local` must use `GEMINI_API_KEY`
- `streamObject` from `ai` — after draining `partialObjectStream`, `result.object` still resolves correctly (internal tee in AI SDK)
- Tailwind class names used in GuideClient for section states: `border-accent-soft`, `bg-accent-soft/20`, `bg-accent-soft/30` — defined in `tailwind.config.ts`

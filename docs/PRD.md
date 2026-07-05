# Meridian — Product Requirements Document

**Tagline:** Your reference line for any codebase.
**Version:** 1.0
**Status:** Draft

---

## 1. Problem Statement

New developers joining a codebase get almost no structured help. A README that says `npm install`, access to GitHub, and a Slack message saying "ask if you have questions." That's the industry standard.

Existing tools fail in distinct ways:
- **Swimm** — keeps docs fresh, but assumes someone wrote them first
- **Greptile** — answers questions reactively, but you need to already know what to ask
- **Google Code Wiki / DocuWriter** — generates reference documentation, overwhelming and not structured as a journey
- **CodeSee** — visualises structure, not meaning

Nobody produces a **curated, narrative, opinionated guide structured as a journey** — the thing a senior engineer would write for a new hire on day one that says: *"here's how to think about this system, here's what to read first, here's what will trip you up."*

The knowledge exists. It lives in git history, PR descriptions, TODO comments, test files, and the heads of senior engineers. Meridian reads all of it and surfaces it as a guide.

---

## 2. Target Users / Personas

### Alex — The New Hire
Junior-to-mid dev who just joined an engineering team. Given GitHub access, expected to be productive in 2 weeks. Has no structured onboarding. Spends the first week pinging senior engineers with "where does X live?" questions.

### Priya — The Freelance Dev
Picked up a contract on a 3-year-old codebase. Client wants features fast. No documentation. Has to reverse-engineer architecture by reading 50,000 lines of code.

### Marcus — The Open Source Contributor
Wants to make their first contribution to a large open source project. CONTRIBUTING.md says "run tests before submitting a PR." No guidance on where to start, what patterns to follow, or which areas are safe to touch.

### Sarah — The Engineering Manager
Tired of senior engineers spending 2 hours onboarding every new hire. Wants something she can share on day one that answers the common questions before they're even asked.

---

## 3. User Stories (MoSCoW)

### Must Have
- As a developer, I can paste a public GitHub repo URL and get a structured onboarding guide
- As a developer, I can read what the project does in plain English — no jargon, no assumed context
- As a developer, I can read the architecture explained as a narrative mental model (not a diagram)
- As a developer, I can see which files to read first and in what order, with explanations for each
- As a developer, I can follow step-by-step local setup instructions derived from the actual scripts
- As a developer, I can see known gotchas and areas of technical debt (surfaced from TODOs, FIXMEs, git anomalies)
- As a developer, I can see a structured Day 1 / Week 1 onboarding plan
- As a developer, I can share the generated guide via a URL
- As a developer, I can see a freshness indicator showing how many commits have happened since the guide was generated

### Should Have
- As a developer, I can connect a private repo via GitHub OAuth
- As a developer, I can see who owns which parts of the codebase (inferred from git blame)
- As a developer, I can see why each major dependency is used — specific to this project, not generic docs
- As a developer, I can see 3–5 suggested first PRs / starter contributions
- As a developer, I can export the guide as Markdown
- As a developer, I can use my own API key (BYOK) for unlimited analyses

### Could Have
- As a developer, I can mark sections as read and track my onboarding progress
- As an EM, I can add team annotations / corrections to the generated guide
- As a developer, I can see a diff view showing what changed in the guide since the last generation

### Won't Have (v1)
- User accounts or authentication
- Persistent database storage
- Team collaboration features
- Billing or subscriptions
- IDE integrations

---

## 4. Guide Sections (Output)

Every generated guide contains the following sections in order:

| # | Section | Source Data |
|---|---|---|
| 1 | **What this project is** | README, repo description, top-level structure |
| 2 | **Architecture in plain English** | File structure, key imports, framework detection |
| 3 | **Reading order** | File importance scoring, entry points, dependency graph |
| 4 | **Local setup walkthrough** | package.json scripts, Makefile, docker-compose, .env.example |
| 5 | **Known gotchas** | TODO/FIXME/HACK comments, git history anomalies, large commits |
| 6 | **Tech stack context** | package.json deps + how each is actually used in the code |
| 7 | **Who owns what** | git blame on key files, contributor patterns |
| 8 | **First PR suggestions** | Test coverage gaps, small isolated modules, labelled issues |
| 9 | **Day 1 / Week 1 plan** | Synthesised from all above |

---

## 5. Analysis Inputs

What Meridian reads from a repository:

| Input | How it's fetched | What it informs |
|---|---|---|
| File/folder tree | GitHub API — recursive tree | Architecture, reading order |
| README + /docs | GitHub API — file contents | Project overview |
| package.json / requirements.txt / Cargo.toml / go.mod | GitHub API — file contents | Tech stack, setup |
| Makefile / docker-compose.yml / .env.example | GitHub API — file contents | Local setup |
| Git log (last 100 commits) | GitHub API — commits endpoint | Evolution, decisions, anomalies |
| PR titles + descriptions (last 50 merged) | GitHub API — pulls endpoint | Context not in code |
| TODO / FIXME / HACK / NOTE comments | GitHub API — file contents (sampled) | Known debt and gotchas |
| Test files | GitHub API — file contents (sampled) | Intended behaviour |
| git blame on key files | GitHub API — blame endpoint | Ownership mapping |

---

## 6. Constraints

| Constraint | Decision |
|---|---|
| Operating cost | $0 — free tier only |
| Storage | None — fully stateless, no database |
| Auth | None for public repos. GitHub OAuth for private repos (v1 Should Have) |
| Free model | Gemini 2.0 Flash via shared server-side key |
| Free tier limit | 3 analyses/day per IP |
| BYOK providers | Gemini, Groq (free), Claude, OpenAI |
| Key storage | Browser localStorage only — never server-side |
| License | MIT, open source |
| Deployment | Vercel free tier |

---

## 7. Acceptance Criteria

- Guide generates in under 90 seconds for repos up to 500 files
- Each section is clearly labelled, skippable, and independently readable
- Shareable link works without authentication for public repo guides
- Freshness indicator shows commit count since last generation
- Free tier enforced: 3 analyses/day per IP
- Guide is readable on mobile (responsive layout)
- Markdown export downloads a well-formatted .md file

---

## 8. Success Metrics (Portfolio / Launch)

- Works end-to-end on at least 10 well-known public repos (React, Next.js, FastAPI, Rails, etc.)
- Guide quality: someone new to a repo can follow it and set up locally in under 30 minutes
- Shareable link loads in under 2 seconds
- Clean, impressive demo: paste a repo URL → watch sections stream in → share link

---

## 9. Out of Scope

- Real-time documentation sync (that's Swimm)
- Q&A / chat interface over the codebase (that's Greptile)
- Visual dependency graphs (that's CodeSee)
- Public API for programmatic access
- CLI tool
- VS Code extension

import { streamObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import type { RepoContext, Provider } from "./types";

const SYSTEM_PROMPT = `You are a senior engineer who has spent 3 months working on this codebase.
A new developer is joining the team today. Write them a comprehensive onboarding guide.
Be specific to THIS codebase — never give generic advice.
Use plain English. Avoid jargon. Be opinionated about what matters.
Always respond with complete, well-formed JSON matching the requested schema exactly.`;

export const GuideSectionsSchema = z.object({
  overview: z.object({
    summary: z
      .string()
      .describe("3 paragraphs of plain English describing what this project is and does"),
    whatItIsNot: z
      .string()
      .describe("Clarifies scope by stating what the project is NOT — prevents misuse"),
  }),
  architecture: z.object({
    narrative: z
      .string()
      .describe(
        "Plain English explanation of how the codebase is organized and how data flows through it"
      ),
    keyPatterns: z
      .array(z.string())
      .describe("Key architectural patterns used in this codebase, e.g. 'event-driven', 'repository pattern'"),
  }),
  readingOrder: z
    .array(
      z.object({
        file: z.string(),
        reason: z.string(),
        timeEstimate: z.string().describe("Human-readable estimate like '~5 min' or '~15 min'"),
      })
    )
    .describe("Ordered list of files a new dev should read first, with WHY each matters"),
  localSetup: z
    .array(
      z.object({
        step: z.string(),
        // Nullable (not optional): Groq's strict json_schema mode requires every
        // property to be listed in `required`. Renderers treat null as absent.
        command: z.string().nullable(),
        note: z.string().nullable(),
      })
    )
    .describe("Step-by-step local setup derived from actual scripts and config in the repo"),
  gotchas: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(["high", "medium", "low"]),
        source: z.enum(["todo", "fixme", "git_history", "pr_comment"]),
      })
    )
    .describe("Known sharp edges that will bite a new dev — derived from TODOs, git history, and PRs"),
  techStack: z
    .array(
      z.object({
        name: z.string(),
        // Nullable (not optional): Groq's strict json_schema mode requires every
        // property to be listed in `required`. Some deps genuinely have no
        // discoverable version (e.g. no lockfile/manifest entry) — renderers
        // treat null as absent.
        version: z.string().nullable(),
        whyUsedHere: z
          .string()
          .describe("Why THIS repo uses this dep — never generic documentation copy"),
      })
    )
    .describe("Key dependencies with their role in this specific codebase"),
  ownership: z
    .array(
      z.object({
        area: z.string(),
        // Nullable: git blame data can be too sparse/uniform to attribute a
        // single owner. Same strict-schema constraint as `version` above.
        primaryOwner: z.string().nullable(),
        files: z.array(z.string()),
      })
    )
    .describe("Who owns which area of the codebase based on git blame and commit patterns"),
  firstPRs: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        area: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]),
      })
    )
    .describe("Concrete first PR suggestions for a new contributor, grounded in actual codebase gaps"),
  weekOnePlan: z.object({
    day1: z.array(z.string()).describe("Tasks for day 1: orientation and local setup"),
    week1: z.array(z.string()).describe("Goals for the rest of week 1: first real contributions"),
  }),
});

function truncate(str: string, maxChars: number): string {
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars) + "\n[truncated]";
}

function buildPrompt(context: RepoContext): string {
  const parts: string[] = [];

  parts.push(
    `## Repository: ${context.owner}/${context.repo}
Description: ${context.description || "No description provided"}
Primary Language: ${context.language}
Stars: ${context.stars}
Default Branch: ${context.defaultBranch}`
  );

  if (context.readme) {
    parts.push(`## README\n${truncate(context.readme, 8000)}`);
  }

  const treePaths = context.fileTree
    .filter((f) => f.type === "file")
    .map((f) => f.path)
    .join("\n");
  if (treePaths) {
    parts.push(`## File Tree\n${truncate(treePaths, 4000)}`);
  }

  if (context.packageJson) {
    const manifest = context.packageJson as Record<string, unknown>;
    const relevant = {
      dependencies: manifest.dependencies ?? {},
      devDependencies: manifest.devDependencies ?? {},
      scripts: manifest.scripts ?? {},
    };
    parts.push(
      `## Package Manifest (dependencies, devDependencies, scripts)\n${truncate(JSON.stringify(relevant, null, 2), 3000)}`
    );
  }

  if (context.setupFiles.length > 0) {
    const setupContent = context.setupFiles
      .map((f) => `### ${f.name}\n${truncate(f.content, 1000)}`)
      .join("\n\n");
    parts.push(`## Setup Files\n${setupContent}`);
  }

  if (context.recentCommits.length > 0) {
    const commitsText = context.recentCommits
      .slice(0, 50)
      .map((c) => `${c.date.slice(0, 10)} [${c.author}] ${c.title}`)
      .join("\n");
    parts.push(`## Recent Commits (last 50)\n${truncate(commitsText, 6000)}`);
  }

  if (context.recentPRs.length > 0) {
    const prsText = context.recentPRs
      .slice(0, 30)
      .map((p) => `#${p.number} ${p.title}${p.body ? ": " + p.body.slice(0, 200) : ""}`)
      .join("\n");
    parts.push(`## Recent Pull Requests\n${truncate(prsText, 6000)}`);
  }

  if (context.todos.length > 0) {
    const todosText = context.todos
      .map((t) => `${t.kind} at ${t.file}:${t.line} — ${t.text}`)
      .join("\n");
    parts.push(`## TODOs / FIXMEs / HACKs\n${truncate(todosText, 4000)}`);
  }

  if (context.keyFiles.length > 0) {
    const filesContent = context.keyFiles
      .slice(0, 20)
      .map((f) => `### ${f.path}\n${truncate(f.content, 2000)}`)
      .join("\n\n");
    parts.push(`## Key Source Files\n${filesContent}`);
  }

  if (context.blameData.length > 0) {
    const blameText = context.blameData
      .map((b) => {
        const sorted = Object.entries(b.owners)
          .sort(([, a], [, bv]) => bv - a)
          .slice(0, 3)
          .map(([name, count]) => `${name} (~${count} commits)`)
          .join(", ");
        return `${b.file}: ${sorted}`;
      })
      .join("\n");
    parts.push(`## Ownership Signals (from git history)\n${blameText}`);
  }

  parts.push(`---

Generate a comprehensive developer onboarding guide based on the repository data above.
Every insight must reference specific files, functions, commands, or patterns found in the data — never give generic advice.
If you lack data for a section, make a reasonable inference from the file structure and commit patterns.`);

  return parts.join("\n\n---\n\n");
}

// Groq model for both the free tier and BYOK Groq. Requirements:
//  1. Supports `json_schema` structured output (streamObject needs it) —
//     rules out llama-3.3-70b-versatile.
//  2. High enough free-tier TPM for Meridian's large repo prompts (~13k tokens
//     for a medium repo) — rules out gpt-oss-20b/120b (8k TPM) and qwen3 (6k).
// llama-4-scout supports json_schema and has 30k TPM on the free tier.
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function getModel(provider: Provider, apiKey?: string | null) {
  switch (provider) {
    case "gemini":
      return createGoogleGenerativeAI({ apiKey: apiKey! })("gemini-2.0-flash");
    case "claude":
      return createAnthropic({ apiKey: apiKey! })("claude-haiku-4-5-20251001");
    case "openai":
      return createOpenAI({ apiKey: apiKey! })("gpt-4o-mini");
    case "groq":
      return createGroq({ apiKey: apiKey! })(GROQ_MODEL);
    default:
      // Free/shared tier — server-side Groq key. Switched from Gemini, whose
      // free tier required a quota-enabled key; Groq's free tier is genuinely $0.
      // Caveat: Groq enforces a per-minute token cap, so very large repo prompts
      // may hit 429.
      return createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" })(GROQ_MODEL);
  }
}

export function streamGuide(
  context: RepoContext,
  provider: Provider,
  apiKey?: string | null,
  // streamObject swallows streaming errors by default (they don't surface via
  // partialObjectStream and result.object can hang). Callers pass onError to
  // capture the failure and fail fast instead of hanging until client timeout.
  onError?: (error: unknown) => void
) {
  return streamObject({
    model: getModel(provider, apiKey),
    schema: GuideSectionsSchema,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(context),
    onError: onError ? ({ error }) => onError(error) : undefined,
  });
}

/**
 * Meridian — shared TypeScript types.
 *
 * Single source of truth for the data that flows through the app:
 *   GuideRequest  →  RepoContext (assembled from GitHub)  →  Guide (AI output)
 *
 * Mirrors the data models in docs/TDD.md §4. Keep this file in sync with the TDD.
 */

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

/** AI providers. `shared` is the free server-side Gemini key (rate limited). */
export type Provider = "shared" | "gemini" | "groq" | "claude" | "openai";

/** Providers a user can bring their own key for (everything except the shared tier). */
export type ByokProvider = Exclude<Provider, "shared">;

/* -------------------------------------------------------------------------- */
/* Request                                                                    */
/* -------------------------------------------------------------------------- */

export type GuideRequest = {
  repoUrl: string;
  apiKey?: string | null;
  provider?: Provider;
};

/* -------------------------------------------------------------------------- */
/* GitHub context — assembled before the AI call                              */
/* -------------------------------------------------------------------------- */

export type FileNode = {
  path: string;
  type: "file" | "dir";
  /** Size in bytes for files; omitted for directories. */
  size?: number;
};

export type SetupFile = {
  /** e.g. "Makefile", "docker-compose.yml", ".env.example" */
  name: string;
  path: string;
  content: string;
};

export type Commit = {
  sha: string;
  title: string;
  message: string;
  author: string;
  date: string;
};

export type PullRequest = {
  number: number;
  title: string;
  body: string;
  labels: string[];
  mergedAt: string;
};

export type TodoKind = "TODO" | "FIXME" | "HACK" | "NOTE";

export type TodoItem = {
  kind: TodoKind;
  text: string;
  file: string;
  line: number;
};

export type KeyFile = {
  path: string;
  content: string;
  /** Importance score used to pick which files to sample (see TDD §5). */
  score: number;
};

export type BlameEntry = {
  file: string;
  /** Map of contributor → approximate line ownership count. */
  owners: Record<string, number>;
};

export type RepoContext = {
  owner: string;
  repo: string;
  description: string;
  defaultBranch: string;
  language: string;
  stars: number;
  fileTree: FileNode[];
  readme: string;
  packageJson?: Record<string, unknown>;
  setupFiles: SetupFile[];
  recentCommits: Commit[];
  recentPRs: PullRequest[];
  todos: TodoItem[];
  keyFiles: KeyFile[];
  blameData: BlameEntry[];
};

/* -------------------------------------------------------------------------- */
/* Guide — the AI structured output                                           */
/* -------------------------------------------------------------------------- */

export type Severity = "high" | "medium" | "low";
export type Difficulty = "easy" | "medium" | "hard";
export type GotchaSource = "todo" | "fixme" | "git_history" | "pr_comment";

export type ReadingItem = {
  file: string;
  reason: string;
  /** Human-readable estimate, e.g. "~5 min". */
  timeEstimate: string;
};

export type SetupStep = {
  step: string;
  command?: string;
  note?: string;
};

export type Gotcha = {
  title: string;
  description: string;
  severity: Severity;
  source: GotchaSource;
};

export type TechItem = {
  name: string;
  version: string;
  /** Why it's used *in this repo* — never generic docs. */
  whyUsedHere: string;
};

export type OwnerArea = {
  area: string;
  primaryOwner: string;
  files: string[];
};

export type PRSuggestion = {
  title: string;
  description: string;
  area: string;
  difficulty: Difficulty;
};

export type GuideSections = {
  overview: {
    /** ~3 paragraphs of plain English. */
    summary: string;
    /** Clarifies scope by stating what the project is *not*. */
    whatItIsNot: string;
  };
  architecture: {
    narrative: string;
    keyPatterns: string[];
  };
  readingOrder: ReadingItem[];
  localSetup: SetupStep[];
  gotchas: Gotcha[];
  techStack: TechItem[];
  ownership: OwnerArea[];
  firstPRs: PRSuggestion[];
  weekOnePlan: {
    day1: string[];
    week1: string[];
  };
};

/** Ordered list of section keys — drives sidebar nav and streaming order. */
export const SECTION_ORDER = [
  "overview",
  "architecture",
  "readingOrder",
  "localSetup",
  "gotchas",
  "techStack",
  "ownership",
  "firstPRs",
  "weekOnePlan",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  overview: "What this is",
  architecture: "Architecture",
  readingOrder: "Reading order",
  localSetup: "Local setup",
  gotchas: "Known gotchas",
  techStack: "Tech stack",
  ownership: "Who owns what",
  firstPRs: "First PRs",
  weekOnePlan: "Day 1 / Week 1",
};

export type Guide = {
  id: string;
  repoUrl: string;
  repoName: string;
  generatedAt: string;
  /** Commit SHA the guide was generated against — used for freshness tracking. */
  commitSha: string;
  sections: GuideSections;
};

/* -------------------------------------------------------------------------- */
/* Streaming + status                                                         */
/* -------------------------------------------------------------------------- */

export type GuideStatus = "idle" | "analyzing" | "streaming" | "complete" | "error";

/** One server-sent event in the analysis stream (see TDD §7). */
export type StreamEvent =
  | { type: "status"; stage: string }
  | { type: "section"; name: SectionKey; content: unknown }
  | { type: "meta"; guide: Pick<Guide, "id" | "repoUrl" | "repoName" | "generatedAt" | "commitSha"> }
  | { type: "error"; message: string };

export type ApiError = {
  status: 400 | 404 | 429 | 500;
  message: string;
};

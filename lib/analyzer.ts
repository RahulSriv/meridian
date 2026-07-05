import { parseRepoUrl } from "./utils";
import {
  makeOctokit,
  fetchRepoMeta,
  fetchFileTree,
  fetchFileContent,
  fetchCommits,
  fetchMergedPRs,
  fetchBlameApprox,
  fetchSetupFiles,
} from "./github";
import type { RepoContext, FileNode, KeyFile, TodoItem, TodoKind } from "./types";

// ── File importance scoring ────────────────────────────────────────────────────

const ENTRY_POINT_RE = /^(index|main|app|server|cli)\.(tsx?|jsx?|py|go|rs|rb)$/i;
const CONFIG_FILE_RE =
  /^(tsconfig|eslintrc|jest\.config|vite\.config|next\.config|webpack\.config)\.(ts|js|json|mjs|cjs)$/i;
const MANIFEST_NAMES = [
  "package.json",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "Pipfile",
  "composer.json",
  "Gemfile",
];
const SETUP_FILE_NAMES = [
  "Makefile",
  "makefile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  ".env.sample",
  ".env.template",
];

// Files whose content is non-text — decoding them as UTF-8 (as fetchFileContent
// does for every file) produces garbled binary-as-text that corrupts the AI
// prompt and breaks structured JSON generation.
const BINARY_EXT_RE =
  /\.(png|jpe?g|gif|bmp|ico|webp|svg|pdf|zip|tar|gz|rar|7z|pkl|pickle|npy|npz|h5|hdf5|onnx|pt|pth|bin|db|sqlite3?|parquet|pyc|pyo|class|o|so|dll|exe|dylib|ttf|woff2?|eot|mp3|mp4|wav|avi|mov|mkv|jar|whl)$/i;

function basename(path: string): string {
  return path.split("/").pop() ?? "";
}

function scoreFile(path: string): number {
  const name = basename(path);
  const depth = path.split("/").length;

  if (ENTRY_POINT_RE.test(name)) return 100;
  if (CONFIG_FILE_RE.test(name)) return 80;
  if (MANIFEST_NAMES.includes(name)) return 80;
  if (SETUP_FILE_NAMES.some((s) => s.toLowerCase() === name.toLowerCase())) return 70;
  if (depth <= 2 && /\.(tsx?|jsx?|py|go|rs|rb)$/.test(name)) return 60;
  if (/\.(test|spec)\.(tsx?|jsx?|py)$/.test(name)) return 30;
  return Math.max(10 - depth * 2, 1);
}

function isEntryPoint(path: string): boolean {
  return ENTRY_POINT_RE.test(basename(path));
}

// ── TODO extraction ────────────────────────────────────────────────────────────

const TODO_RE = /\b(TODO|FIXME|HACK|NOTE)\b[:\s]+(.*)/i;

function extractTodos(content: string, filePath: string): TodoItem[] {
  const todos: TodoItem[] = [];
  content.split("\n").forEach((line, i) => {
    const m = TODO_RE.exec(line);
    if (m) {
      todos.push({
        kind: m[1].toUpperCase() as TodoKind,
        text: m[2].trim(),
        file: filePath,
        line: i + 1,
      });
    }
  });
  return todos;
}

// ── Concurrency-limited batch fetch ───────────────────────────────────────────

async function batchFetch<T>(tasks: (() => Promise<T>)[], concurrency = 5): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const settled = await Promise.all(tasks.slice(i, i + concurrency).map((fn) => fn()));
    results.push(...settled);
  }
  return results;
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function buildRepoContext(repoUrl: string, token?: string): Promise<RepoContext> {
  // Step 1 — parse URL
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub URL");
  const { owner, repo } = parsed;

  const octokit = makeOctokit(token);

  // Phase 1 — metadata + file tree in parallel (Steps 2–3)
  const [meta, fileTree] = await Promise.all([
    fetchRepoMeta(octokit, owner, repo),
    fetchFileTree(octokit, owner, repo, "HEAD"),
  ]);

  const files = fileTree.filter((n): n is FileNode => n.type === "file");
  const allPaths = files.map((f) => f.path);

  // Locate manifest + setup files within the tree
  const manifestPath = allPaths.find((p) => MANIFEST_NAMES.includes(basename(p)));
  const setupPaths = allPaths.filter((p) =>
    SETUP_FILE_NAMES.some((s) => s.toLowerCase() === basename(p).toLowerCase())
  );
  const readmePath = allPaths.find((p) => /^readme\.(md|txt|rst)$/i.test(basename(p)));

  // Phase 2 — parallel independent fetches (Steps 4–8)
  const [readmeRaw, manifestRaw, setupFiles, recentCommits, recentPRs] = await Promise.all([
    // Step 4 — README
    readmePath ? fetchFileContent(octokit, owner, repo, readmePath) : Promise.resolve(null),
    // Step 5 — manifest
    manifestPath ? fetchFileContent(octokit, owner, repo, manifestPath) : Promise.resolve(null),
    // Step 6 — setup files
    fetchSetupFiles(octokit, owner, repo, setupPaths),
    // Step 7 — commits
    fetchCommits(octokit, owner, repo),
    // Step 8 — merged PRs
    fetchMergedPRs(octokit, owner, repo),
  ]);

  const readme = readmeRaw ?? "";
  let packageJson: Record<string, unknown> | undefined;
  if (manifestRaw) {
    try {
      packageJson = JSON.parse(manifestRaw);
    } catch {
      packageJson = { _raw: manifestRaw };
    }
  }

  // Step 9 — score files, pick top 20, fetch contents
  const SKIP_RE = /node_modules|\.git\b|\/dist\/|\/build\/|\/\.next\/|__pycache__/;
  const scoredFiles = files
    .filter((f) => !SKIP_RE.test(f.path) && !BINARY_EXT_RE.test(f.path))
    .map((f) => ({ ...f, score: scoreFile(f.path) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const keyFileTasks = scoredFiles.map((f) => async (): Promise<KeyFile | null> => {
    const content = await fetchFileContent(octokit, owner, repo, f.path);
    return content ? { path: f.path, content, score: f.score } : null;
  });

  const keyFileResults = await batchFetch(keyFileTasks, 5);
  const keyFiles = keyFileResults.filter((r): r is KeyFile => r !== null);

  // Step 10 — extract TODOs from key files
  const todos: TodoItem[] = keyFiles.flatMap((f) => extractTodos(f.content, f.path));

  // Step 11 — approximate blame for entry-point files
  const entryPoints = files
    .filter((f) => isEntryPoint(f.path))
    .map((f) => f.path)
    .slice(0, 5);

  const blameData = entryPoints.length > 0
    ? await fetchBlameApprox(octokit, owner, repo, entryPoints)
    : [];

  // Step 12 — assemble RepoContext
  return {
    owner,
    repo,
    description: meta.description,
    defaultBranch: meta.defaultBranch,
    language: meta.language,
    stars: meta.stars,
    fileTree,
    readme,
    packageJson,
    setupFiles,
    recentCommits,
    recentPRs,
    todos,
    keyFiles,
    blameData,
  };
}

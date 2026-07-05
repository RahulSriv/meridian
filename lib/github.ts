import { Octokit } from "@octokit/rest";
import type { FileNode, SetupFile, Commit, PullRequest, BlameEntry } from "./types";

export function makeOctokit(token?: string): Octokit {
  return new Octokit({ auth: token ?? process.env.GITHUB_TOKEN ?? undefined });
}

function decodeBase64Content(encoded: string): string {
  return Buffer.from(encoded.replace(/\n/g, ""), "base64").toString("utf-8");
}

export async function fetchRepoMeta(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ description: string; defaultBranch: string; language: string; stars: number }> {
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    description: data.description ?? "",
    defaultBranch: data.default_branch,
    language: data.language ?? "",
    stars: data.stargazers_count,
  };
}

export async function fetchFileTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<FileNode[]> {
  const { data } = await octokit.git.getTree({ owner, repo, tree_sha: branch, recursive: "1" });
  return data.tree
    .filter((item) => !!item.path && !!item.type)
    .map((item) => ({
      path: item.path!,
      type: item.type === "tree" ? "dir" : ("file" as "file" | "dir"),
      size: item.size,
    }));
}

export async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) return null; // directory
    if ("content" in data && data.encoding === "base64") {
      return decodeBase64Content(data.content);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchCommits(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Commit[]> {
  const { data } = await octokit.repos.listCommits({ owner, repo, per_page: 100 });
  return data.map((c) => ({
    sha: c.sha,
    title: c.commit.message.split("\n")[0],
    message: c.commit.message,
    author: c.commit.author?.name ?? c.author?.login ?? "unknown",
    date: c.commit.author?.date ?? "",
  }));
}

export async function fetchMergedPRs(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<PullRequest[]> {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 50,
  });
  return data
    .filter((pr) => pr.merged_at != null)
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? "",
      labels: pr.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))),
      mergedAt: pr.merged_at!,
    }));
}

// Approximates blame via per-file commit history — REST API doesn't expose line-level blame.
export async function fetchBlameApprox(
  octokit: Octokit,
  owner: string,
  repo: string,
  paths: string[]
): Promise<BlameEntry[]> {
  const results = await Promise.all(
    paths.map(async (path): Promise<BlameEntry | null> => {
      try {
        const { data } = await octokit.repos.listCommits({ owner, repo, path, per_page: 100 });
        const owners: Record<string, number> = {};
        for (const c of data) {
          const author = c.commit.author?.name ?? c.author?.login ?? "unknown";
          owners[author] = (owners[author] ?? 0) + 1;
        }
        return Object.keys(owners).length > 0 ? { file: path, owners } : null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is BlameEntry => r !== null);
}

// Compares a base commit against the current branch tip to detect staleness.
// `newCommits` is how many commits the branch is ahead of the guide's base SHA.
export async function fetchCommitDelta(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseSha: string,
  branch: string
): Promise<{ newCommits: number; latestSha: string }> {
  const { data } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${baseSha}...${branch}`,
  });
  const latestSha = data.commits.length > 0 ? data.commits[data.commits.length - 1].sha : baseSha;
  return { newCommits: data.ahead_by, latestSha };
}

export async function fetchSetupFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePaths: string[]
): Promise<SetupFile[]> {
  const results = await Promise.all(
    filePaths.map(async (path): Promise<SetupFile | null> => {
      const content = await fetchFileContent(octokit, owner, repo, path);
      if (!content) return null;
      return { name: path.split("/").pop()!, path, content };
    })
  );
  return results.filter((r): r is SetupFile => r !== null);
}

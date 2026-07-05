import { NextRequest } from "next/server";
import { z } from "zod";
import { makeOctokit, fetchRepoMeta, fetchCommitDelta } from "@/lib/github";
import { parseRepoUrl } from "@/lib/utils";

const RequestSchema = z.object({
  repoUrl: z.string(),
  commitSha: z.string().min(1),
});

/**
 * Reports whether a guide is stale: compares the commit it was generated against
 * with the current default-branch tip. Uses the server GITHUB_TOKEN — never the
 * client AI key. Stateless; safe to call on demand from the guide page.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid request" }, 400);
  }

  const repo = parseRepoUrl(parsed.data.repoUrl);
  if (!repo) {
    return json({ error: "Invalid GitHub URL" }, 400);
  }

  try {
    const octokit = makeOctokit();
    const { defaultBranch } = await fetchRepoMeta(octokit, repo.owner, repo.repo);
    const { newCommits, latestSha } = await fetchCommitDelta(
      octokit,
      repo.owner,
      repo.repo,
      parsed.data.commitSha,
      defaultBranch
    );
    return json({
      stale: newCommits > 0,
      newCommits,
      latestSha,
      defaultBranch,
    });
  } catch {
    // Compare can 404 (force-push, rebased history) or hit rate limits.
    // Freshness is best-effort — never block the guide on it.
    return json({ stale: false, newCommits: 0, unknown: true });
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

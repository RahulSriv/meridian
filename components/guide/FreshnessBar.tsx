"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  GitCommitHorizontal,
  Clock,
  RefreshCw,
} from "lucide-react";

interface Props {
  repoUrl: string;
  commitSha: string;
  generatedAt: string;
  onRegenerate: () => void;
}

type FreshnessState =
  | { status: "checking" }
  | { status: "fresh" }
  | { status: "stale"; newCommits: number }
  | { status: "unknown" };

export function FreshnessBar({ repoUrl, commitSha, generatedAt, onRegenerate }: Props) {
  const [state, setState] = useState<FreshnessState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    if (!commitSha) {
      setState({ status: "unknown" });
      return;
    }

    setState({ status: "checking" });
    fetch("/api/freshness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl, commitSha }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.unknown || typeof data?.newCommits !== "number") {
          setState({ status: "unknown" });
        } else if (data.stale) {
          setState({ status: "stale", newCommits: data.newCommits });
        } else {
          setState({ status: "fresh" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unknown" });
      });

    return () => {
      cancelled = true;
    };
  }, [repoUrl, commitSha]);

  const shortSha = commitSha ? commitSha.slice(0, 7) : "";
  const commitUrl = commitSha ? `${repoUrl}/commit/${commitSha}` : repoUrl;
  const isStale = state.status === "stale";

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-body-sm ${
        isStale
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border-default bg-bg-surface"
      }`}
    >
      {/* Status pill */}
      <span className="inline-flex items-center gap-1.5">
        {state.status === "checking" && (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" />
            <span className="text-text-muted">Checking for updates…</span>
          </>
        )}
        {state.status === "fresh" && (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-default" />
            <span className="text-text-secondary">Up to date with the latest commit</span>
          </>
        )}
        {state.status === "stale" && (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200">
              {state.newCommits} new commit{state.newCommits === 1 ? "" : "s"} since this guide was
              generated
            </span>
          </>
        )}
        {state.status === "unknown" && (
          <>
            <GitCommitHorizontal className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">Freshness unavailable</span>
          </>
        )}
      </span>

      <span className="inline-flex items-center gap-1.5 text-text-muted">
        <Clock className="w-3.5 h-3.5" />
        Generated {relativeTime(generatedAt)}
      </span>

      {shortSha && (
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-text-muted hover:text-text-primary transition-colors"
        >
          <GitCommitHorizontal className="w-3.5 h-3.5" />
          {shortSha}
        </a>
      )}

      {isStale && (
        <button
          onClick={onRegenerate}
          className="ml-auto inline-flex items-center gap-1.5 text-accent-default hover:text-accent-hover transition-colors font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      )}
    </div>
  );
}

/** Compact relative time, e.g. "just now", "5 min ago", "2 hr ago", "3 days ago". */
function relativeTime(iso: string): string {
  if (!iso) return "recently";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 45) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

"use client";

import { cn, parseRepoUrl, encodeGuideId } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, GitFork } from "lucide-react";
import { Button } from "@/components/shared/Button";

const EXAMPLE_PLACEHOLDER = "https://github.com/honojs/hono";

export function RepoInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRepoUrl(value);
    if (!parsed) {
      setError("That doesn't look like a public GitHub repo. Try owner/repo or a github.com URL.");
      return;
    }
    setError(null);
    const repoUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
    router.push(`/guide/${encodeGuideId(repoUrl)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-bg-surface/80 p-2 backdrop-blur transition-colors",
          error ? "border-error" : "border-border-strong focus-within:border-accent-default"
        )}
      >
        <span className="pl-3 text-text-muted">
          <GitFork className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={EXAMPLE_PLACEHOLDER}
          aria-label="GitHub repository URL"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-body-lg text-text-primary placeholder:text-text-muted focus:outline-none font-mono text-[0.95rem]"
        />
        <Button type="submit" size="lg" className="shrink-0">
          Generate guide
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-body-sm text-error">{error}</p>
      ) : (
        <p className="mt-3 text-body-sm text-text-muted">
          Any public GitHub repo. No sign-in. 3 free guides per day, or bring your own key.
        </p>
      )}
    </form>
  );
}

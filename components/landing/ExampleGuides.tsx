import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { encodeGuideId } from "@/lib/utils";

const EXAMPLES = [
  { owner: "honojs",   repo: "hono",   blurb: "Ultrafast web framework for the edge", lang: "TypeScript" },
  { owner: "pallets",  repo: "flask",  blurb: "The Python micro web framework",        lang: "Python" },
  { owner: "fastapi",  repo: "fastapi",blurb: "Modern, fast Python API framework",      lang: "Python" },
  { owner: "tinygrad", repo: "tinygrad",blurb: "A tiny deep-learning framework",        lang: "Python" },
];

export function ExampleGuides() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-display-lg text-text-primary">Try it on a familiar repo</h2>
          <p className="mt-3 text-body-lg text-text-secondary">
            See the kind of guide Meridian produces before pointing it at your own.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {EXAMPLES.map((ex) => {
          const repoUrl = `https://github.com/${ex.owner}/${ex.repo}`;
          return (
            <Link
              key={`${ex.owner}/${ex.repo}`}
              href={`/guide/${encodeGuideId(repoUrl)}`}
              className="group flex items-center justify-between rounded-xl border border-border-default bg-bg-surface p-5 transition-all hover:border-accent-default hover:bg-bg-elevated"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-heading-md text-text-primary truncate">
                    {ex.owner}/{ex.repo}
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-text-secondary truncate">{ex.blurb}</p>
                <div className="mt-3 flex items-center gap-3 text-label-md text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-default" />
                    {ex.lang}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> Popular
                  </span>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 shrink-0 text-text-muted transition-colors group-hover:text-accent-default" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

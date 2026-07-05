import { Link2, ScanSearch, Map } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "Drop in a repo",
    body: "Paste any public GitHub URL. No clone, no install, no access tokens required.",
  },
  {
    icon: ScanSearch,
    title: "Meridian reads everything",
    body: "File tree, README, package manifests, the last 100 commits, merged PRs, and TODO/FIXME trails — the knowledge that usually lives only in senior engineers' heads.",
  },
  {
    icon: Map,
    title: "Get a guided tour",
    body: "A nine-section guide streams in: what it is, the architecture as a mental model, what to read first, setup steps, gotchas, and a Day 1 / Week 1 plan.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-display-lg text-text-primary">How it works</h2>
        <p className="mt-3 text-body-lg text-text-secondary">
          Three steps from a cold repo to a confident first day.
        </p>
      </div>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="group relative rounded-xl border border-border-default bg-bg-surface p-6 transition-colors hover:border-border-strong"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-default">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-heading-lg text-border-strong">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-5 text-heading-lg text-text-primary">{step.title}</h3>
            <p className="mt-2 text-body-md text-text-secondary">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

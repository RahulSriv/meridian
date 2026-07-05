import { RepoInput } from "@/components/landing/RepoInput";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Navigational backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-meridian-glow" />
      <div aria-hidden className="pointer-events-none absolute inset-0 meridian-grid opacity-60" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-surface px-3 py-1 text-label-md text-text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-default" />
          Onboarding guides, generated from the repo itself
        </span>

        <h1 className="mt-6 max-w-3xl text-display-xl text-text-primary text-balance">
          Your reference line for{" "}
          <span className="text-accent-default">any codebase</span>.
        </h1>

        <p className="mt-5 max-w-xl text-body-lg text-text-secondary text-balance">
          Paste a public GitHub repo. Meridian reads the code, git history, and PRs and
          writes the onboarding guide a senior engineer would hand you on day one — what it
          is, how it&apos;s built, what to read first, and what will trip you up.
        </p>

        <div className="mt-10 flex w-full flex-col items-center">
          <RepoInput />
        </div>
      </div>

      {/* The meridian: a drawn reference line under the hero */}
      <div aria-hidden className="relative mx-auto max-w-6xl px-6">
        <div className="h-px w-full origin-left animate-draw-line bg-meridian-line" />
      </div>
    </section>
  );
}

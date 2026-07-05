"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  GitFork,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useGuideStore } from "@/store/useGuideStore";
import { useProviderStore } from "@/store/useProviderStore";
import { SECTION_LABELS } from "@/lib/types";
import type { StreamEvent, Guide, SectionKey } from "@/lib/types";
import { GuideLayout } from "@/components/guide/GuideLayout";
import { GuideActions } from "@/components/guide/GuideActions";
import { FreshnessBar } from "@/components/guide/FreshnessBar";
import { GuideSection } from "@/components/guide/GuideSection";
import { OverviewSection } from "@/components/guide/OverviewSection";
import { ArchitectureSection } from "@/components/guide/ArchitectureSection";
import { ReadingOrderSection } from "@/components/guide/ReadingOrderSection";
import { SetupSection } from "@/components/guide/SetupSection";
import { GotchasSection } from "@/components/guide/GotchasSection";
import { TechStackSection } from "@/components/guide/TechStackSection";
import { OwnershipSection } from "@/components/guide/OwnershipSection";
import { FirstPRsSection } from "@/components/guide/FirstPRsSection";
import { WeekOnePlanSection } from "@/components/guide/WeekOnePlanSection";

interface Props {
  repoUrl: string;
  repoName: string;
}

export function GuideClient({ repoUrl, repoName }: Props) {
  const { status, stage, guide, arrivedSections, error, start, applyEvent, setComplete, reset } =
    useGuideStore();
  const { provider, apiKey } = useProviderStore();
  // Bumped by Regenerate to force a fresh analysis run.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    reset();
    start();

    // React Strict Mode (dev only) runs this effect mount → cleanup → mount
    // again. Each invocation gets its own `cancelled`/`controller`, so the
    // first (soon-cleaned-up) request aborts harmlessly while the second
    // proceeds — rather than trying to skip the second invocation, which
    // left the one real request permanently cancelled after its first chunk.
    const controller = new AbortController();
    let cancelled = false;

    async function run() {
      let res: Response;
      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl, provider, apiKey }),
          signal: controller.signal,
        });
      } catch (err) {
        if (!cancelled)
          applyEvent({ type: "error", message: (err as Error).message ?? "Network error" });
        return;
      }

      if (!res.ok || !res.body) {
        try {
          const data = await res.json();
          if (!cancelled) applyEvent({ type: "error", message: data.error ?? "Analysis failed" });
        } catch {
          if (!cancelled) applyEvent({ type: "error", message: "Analysis failed" });
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (cancelled) {
          reader.cancel();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as StreamEvent;
            applyEvent(event);
          } catch {
            // ignore malformed lines
          }
        }
      }

      if (buffer.trim()) {
        try {
          applyEvent(JSON.parse(buffer) as StreamEvent);
        } catch {}
      }

      if (!cancelled) setComplete();
    }

    run().catch((err) => {
      if (!cancelled) applyEvent({ type: "error", message: err.message ?? "Unexpected error" });
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl, reloadKey]);

  const displayName = guide?.repoName ?? repoName;
  const handleRegenerate = () => setReloadKey((k) => k + 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-20">
        {(status === "idle" || status === "analyzing") && (
          <AnalyzingView repoName={repoName} stage={stage} />
        )}
        {status === "streaming" && (
          <GuideResultsView
            repoName={displayName}
            guide={guide}
            arrivedSections={arrivedSections}
            isStreaming
            onRegenerate={handleRegenerate}
          />
        )}
        {status === "complete" && (
          <GuideResultsView
            repoName={displayName}
            guide={guide}
            arrivedSections={arrivedSections}
            isStreaming={false}
            onRegenerate={handleRegenerate}
          />
        )}
        {status === "error" && <ErrorView message={error ?? "Analysis failed"} />}
      </main>
      <Footer />
    </div>
  );
}

// ── Analyzing ──────────────────────────────────────────────────────────────────

function AnalyzingView({ repoName, stage }: { repoName: string; stage: string | null }) {
  const steps = [
    "Fetching repository data",
    "Sampling key files",
    "Scanning commit history",
    "Generating guide",
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-border-default flex items-center justify-center">
          <GitFork className="w-6 h-6 text-text-muted" />
        </div>
        <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-accent-default" />
      </div>

      <div className="space-y-2">
        <h1 className="text-heading-xl text-text-primary">Analyzing repository</h1>
        <p className="text-body-lg text-text-secondary font-mono">{repoName}</p>
      </div>

      <div className="w-full max-w-sm space-y-2">
        {steps.map((step) => (
          <div
            key={step}
            className="flex items-center gap-3 text-body-sm text-text-muted px-4 py-2 rounded-lg bg-bg-surface border border-border-default"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-default shrink-0" />
            <span>{step}…</span>
          </div>
        ))}
      </div>

      {stage && (
        <p className="text-body-sm text-accent-default font-mono animate-pulse">{stage}</p>
      )}
      <p className="text-body-sm text-text-muted">This takes 30–90 seconds for most repos.</p>
    </div>
  );
}

// ── Guide results (streaming + complete) ──────────────────────────────────────

function GuideResultsView({
  repoName,
  guide,
  arrivedSections,
  isStreaming,
  onRegenerate,
}: {
  repoName: string;
  guide: Partial<Guide> | null;
  arrivedSections: SectionKey[];
  isStreaming: boolean;
  onRegenerate: () => void;
}) {
  const sections = guide?.sections;
  const complete = !isStreaming;

  return (
    <GuideLayout
      repoName={repoName}
      arrivedSections={arrivedSections}
      actions={
        <GuideActions guide={guide} complete={complete} onRegenerate={onRegenerate} />
      }
    >
      {complete && guide?.commitSha && guide?.repoUrl && (
        <div className="mb-6">
          <FreshnessBar
            repoUrl={guide.repoUrl}
            commitSha={guide.commitSha}
            generatedAt={guide.generatedAt ?? ""}
            onRegenerate={onRegenerate}
          />
        </div>
      )}

      {isStreaming && (
        <div className="flex items-center gap-2.5 mb-6 text-body-sm text-accent-default font-mono animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating sections…</span>
        </div>
      )}

      <GuideSection
        id="overview"
        label={SECTION_LABELS.overview}
        isLoaded={arrivedSections.includes("overview")}
      >
        {sections?.overview && <OverviewSection data={sections.overview} />}
      </GuideSection>

      <GuideSection
        id="architecture"
        label={SECTION_LABELS.architecture}
        isLoaded={arrivedSections.includes("architecture")}
      >
        {sections?.architecture && <ArchitectureSection data={sections.architecture} />}
      </GuideSection>

      <GuideSection
        id="readingOrder"
        label={SECTION_LABELS.readingOrder}
        isLoaded={arrivedSections.includes("readingOrder")}
      >
        {sections?.readingOrder && <ReadingOrderSection data={sections.readingOrder} />}
      </GuideSection>

      <GuideSection
        id="localSetup"
        label={SECTION_LABELS.localSetup}
        isLoaded={arrivedSections.includes("localSetup")}
      >
        {sections?.localSetup && <SetupSection data={sections.localSetup} />}
      </GuideSection>

      <GuideSection
        id="gotchas"
        label={SECTION_LABELS.gotchas}
        isLoaded={arrivedSections.includes("gotchas")}
      >
        {sections?.gotchas && <GotchasSection data={sections.gotchas} />}
      </GuideSection>

      <GuideSection
        id="techStack"
        label={SECTION_LABELS.techStack}
        isLoaded={arrivedSections.includes("techStack")}
      >
        {sections?.techStack && <TechStackSection data={sections.techStack} />}
      </GuideSection>

      <GuideSection
        id="ownership"
        label={SECTION_LABELS.ownership}
        isLoaded={arrivedSections.includes("ownership")}
      >
        {sections?.ownership && <OwnershipSection data={sections.ownership} />}
      </GuideSection>

      <GuideSection
        id="firstPRs"
        label={SECTION_LABELS.firstPRs}
        isLoaded={arrivedSections.includes("firstPRs")}
      >
        {sections?.firstPRs && <FirstPRsSection data={sections.firstPRs} />}
      </GuideSection>

      <GuideSection
        id="weekOnePlan"
        label={SECTION_LABELS.weekOnePlan}
        isLoaded={arrivedSections.includes("weekOnePlan")}
      >
        {sections?.weekOnePlan && <WeekOnePlanSection data={sections.weekOnePlan} />}
      </GuideSection>

      {!isStreaming && (
        <div className="flex items-center gap-2 pt-2 text-body-sm text-text-muted">
          <CheckCircle2 className="w-4 h-4 text-accent-default" />
          <span>All sections generated</span>
        </div>
      )}
    </GuideLayout>
  );
}

// ── Error ──────────────────────────────────────────────────────────────────────

function ErrorView({ message }: { message: string }) {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h1 className="text-heading-xl text-text-primary">Analysis failed</h1>
          <p className="text-body-md text-text-secondary mt-1">{message}</p>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-body-md text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Try a different repo
      </Link>
    </div>
  );
}

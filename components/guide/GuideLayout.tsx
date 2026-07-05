"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { SECTION_ORDER, SECTION_LABELS } from "@/lib/types";
import type { SectionKey } from "@/lib/types";

interface Props {
  repoName: string;
  arrivedSections: SectionKey[];
  children: React.ReactNode;
  /** Action bar (share / export / regenerate) rendered in the header. */
  actions?: React.ReactNode;
}

export function GuideLayout({ repoName, arrivedSections, children, actions }: Props) {
  return (
    <div className="relative">
      {/* Back link + repo name header */}
      <div className="mb-8 space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-body-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Analyze another repo
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-heading-xl text-text-primary font-mono">{repoName}</h1>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-24 space-y-1">
          {SECTION_ORDER.map((key) => {
            const arrived = arrivedSections.includes(key);
            return (
              <a
                key={key}
                href={`#${key}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm transition-colors ${
                  arrived
                    ? "text-text-primary hover:bg-bg-elevated"
                    : "text-text-muted hover:bg-bg-elevated"
                }`}
              >
                {arrived ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-default shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-border-default shrink-0" />
                )}
                <span>{SECTION_LABELS[key]}</span>
              </a>
            );
          })}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

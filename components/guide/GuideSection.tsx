"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  id: string;
  label: string;
  isLoaded: boolean;
  children: React.ReactNode;
}

function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer h-4 rounded-md"
          style={{ width: `${70 + ((i * 17) % 30)}%` }}
        />
      ))}
    </div>
  );
}

export function GuideSection({ id, label, isLoaded, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <section id={id} className="scroll-mt-24">
      <div className="rounded-xl border border-border-default bg-bg-surface overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-elevated transition-colors"
        >
          <span className="text-heading-md text-text-primary">{label}</span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          )}
        </button>

        {open && (
          <div className="px-6 pb-6 pt-1">
            {isLoaded ? children : <Skeleton />}
          </div>
        )}
      </div>
    </section>
  );
}

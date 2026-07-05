"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { GithubIcon } from "@/components/shared/GithubIcon";
import { Button } from "@/components/shared/Button";
import { ProviderPanel } from "@/components/provider/ProviderPanel";
import { useProviderStore } from "@/store/useProviderStore";

const PROVIDER_LABELS: Record<string, string> = {
  shared: "Free tier",
  gemini: "Gemini",
  groq: "Groq",
  claude: "Claude",
  openai: "OpenAI",
};

export function Header() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { provider, loadFromStorage } = useProviderStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border-default bg-bg-base/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-default">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/RahulSriv/meridian"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-label-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
            <Button variant="secondary" size="sm" onClick={() => setPanelOpen(true)}>
              <Sparkles className="w-4 h-4 text-accent-default" />
              {PROVIDER_LABELS[provider] ?? "Connect AI"}
            </Button>
          </div>
        </div>
      </header>
      <ProviderPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}

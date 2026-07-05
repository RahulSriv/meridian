"use client";

import { useState } from "react";
import { Link2, Check, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { guideToMarkdown, guideFilename } from "@/lib/export";
import type { Guide } from "@/lib/types";

interface Props {
  guide: Partial<Guide> | null;
  /** Full guide ready (all sections present) — gates Export. */
  complete: boolean;
  onRegenerate: () => void;
}

export function GuideActions({ guide, complete, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be blocked (insecure context, permissions) — fall back.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    if (!complete || !guide?.sections) return;
    const markdown = guideToMarkdown(guide as Guide);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = guideFilename({ repoName: guide.repoName ?? "meridian" });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleShare}>
        {copied ? (
          <>
            <Check className="w-4 h-4 text-accent-default" />
            Copied
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Share
          </>
        )}
      </Button>

      <Button variant="secondary" size="sm" onClick={handleExport} disabled={!complete}>
        <Download className="w-4 h-4" />
        Export
      </Button>

      <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={!complete}>
        <RefreshCw className="w-4 h-4" />
        Regenerate
      </Button>
    </div>
  );
}

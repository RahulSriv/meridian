"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { X, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useProviderStore } from "@/store/useProviderStore";
import type { Provider } from "@/lib/types";

interface ProviderPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ProviderDef {
  id: Provider;
  name: string;
  description: string;
  free: boolean;
  keyLink?: string;
  keyPlaceholder?: string;
  badge: string;
}

const PROVIDERS: ProviderDef[] = [
  { id: "shared", name: "Free tier", description: "3 guides/day, zero setup", free: true, badge: "✦" },
  { id: "gemini", name: "Gemini",    description: "Free · bring your own key", free: true,  keyLink: "https://aistudio.google.com/apikey", keyPlaceholder: "AIza...", badge: "G" },
  { id: "groq",   name: "Groq",      description: "Free · bring your own key", free: true,  keyLink: "https://console.groq.com/keys",       keyPlaceholder: "gsk_...", badge: "Gr" },
  { id: "claude", name: "Claude",    description: "Paid · bring your own key", free: false, keyLink: "https://console.anthropic.com/",        keyPlaceholder: "sk-ant-...", badge: "A" },
  { id: "openai", name: "OpenAI",    description: "Paid · bring your own key", free: false, keyLink: "https://platform.openai.com/api-keys",  keyPlaceholder: "sk-...", badge: "O" },
];

export function ProviderPanel({ open, onClose }: ProviderPanelProps) {
  const { provider: activeProvider, apiKey: activeKey, setProvider, disconnect } = useProviderStore();
  const [selected, setSelected] = useState<Provider>(activeProvider);
  const [keyInput, setKeyInput] = useState(activeKey ?? "");

  useEffect(() => {
    if (open) {
      setSelected(activeProvider);
      setKeyInput(activeKey ?? "");
    }
  }, [open, activeProvider, activeKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const selectedDef = PROVIDERS.find((p) => p.id === selected)!;
  const needsKey = selected !== "shared";
  const isConnected = activeProvider === selected && (selected === "shared" || !!activeKey);

  function handleSave() {
    setProvider(selected, needsKey ? keyInput.trim() : undefined);
    onClose();
  }

  function handleDisconnect() {
    disconnect();
    setSelected("shared");
    setKeyInput("");
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect your AI"
        className="fixed right-0 top-0 h-full w-[460px] max-w-full bg-bg-surface border-l border-border-default z-50 flex flex-col shadow-2xl animate-fade-in-up"
      >
        <div className="px-6 pt-6 pb-4 border-b border-border-default">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-heading-lg text-text-primary">Connect your AI</h2>
              <p className="mt-1 text-body-md text-text-secondary">
                The free tier works out of the box. Bring your own key for unlimited guides.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-text-muted hover:text-text-primary transition-colors p-1 -mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "relative text-left p-4 rounded-lg border transition-all duration-150",
                  selected === p.id
                    ? "border-accent-default bg-accent-soft"
                    : "border-border-default bg-bg-elevated hover:bg-bg-hover"
                )}
              >
                {selected === p.id && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-default" />
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded bg-bg-hover flex items-center justify-center text-label-md text-text-secondary font-bold">
                    {p.badge}
                  </span>
                  <span className="text-heading-md text-text-primary">{p.name}</span>
                </div>
                <p className="text-label-md text-text-secondary">{p.description}</p>
              </button>
            ))}
          </div>

          {needsKey && (
            <div className="space-y-3 pt-2">
              <label htmlFor="api-key" className="block text-label-lg text-text-secondary">
                Your {selectedDef.name} API key
              </label>
              <input
                id="api-key"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={selectedDef.keyPlaceholder}
                autoComplete="off"
                className={cn(
                  "w-full bg-bg-elevated border border-border-default rounded-md px-3 py-2.5",
                  "text-body-md text-text-primary placeholder:text-text-muted font-mono",
                  "focus:outline-none focus:ring-1 focus:ring-accent-default focus:border-accent-default",
                  "transition-colors duration-150"
                )}
              />
              {selectedDef.keyLink && (
                <a
                  href={selectedDef.keyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-label-md text-accent-default hover:text-accent-hover transition-colors"
                >
                  {selectedDef.free ? `Get a free ${selectedDef.name} key` : `Get ${selectedDef.name} API key`}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <p className="text-label-md text-text-muted">
                Keys are stored only in this browser&apos;s local storage — never sent to our servers
                except to make the request on your behalf.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-default flex items-center gap-3">
          <Button onClick={handleSave} disabled={needsKey && !keyInput.trim()} className="flex-1">
            {isConnected ? (
              <>
                <Check className="w-4 h-4" /> Connected
              </>
            ) : selected === "shared" ? (
              "Use free tier"
            ) : (
              "Save & connect"
            )}
          </Button>
          {isConnected && activeProvider !== "shared" && (
            <Button variant="ghost" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

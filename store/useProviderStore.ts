import { create } from "zustand";
import type { Provider } from "@/lib/types";

interface ProviderState {
  provider: Provider;
  apiKey: string | null;
  /** Remaining free analyses (only meaningful for the `shared` provider). */
  remaining: number;
  setProvider: (provider: Provider, apiKey?: string) => void;
  setRemaining: (n: number) => void;
  disconnect: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = "meridian_provider";
const WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REMAINING = 3;

type Persisted = {
  provider: Provider;
  apiKey: string | null;
  remaining: number;
  resetAt: number;
};

function saveToStorage(data: Persisted) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  provider: "shared",
  apiKey: null,
  remaining: DEFAULT_REMAINING,

  setProvider: (provider, apiKey) => {
    const { remaining } = get();
    set({ provider, apiKey: apiKey ?? null });
    saveToStorage({ provider, apiKey: apiKey ?? null, remaining, resetAt: Date.now() + WINDOW_MS });
  },

  setRemaining: (remaining) => {
    const { provider, apiKey } = get();
    set({ remaining });
    // Only the shared tier has a server-side limit worth persisting; BYOK is unlimited.
    if (provider === "shared") {
      saveToStorage({ provider, apiKey, remaining, resetAt: Date.now() + WINDOW_MS });
    }
  },

  disconnect: () => {
    set({ provider: "shared", apiKey: null, remaining: DEFAULT_REMAINING });
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { provider, apiKey, remaining, resetAt } = JSON.parse(raw) as Persisted;
      const isExpired = !resetAt || Date.now() > resetAt;
      set({
        provider: provider ?? "shared",
        apiKey: apiKey ?? null,
        remaining: isExpired ? DEFAULT_REMAINING : (remaining ?? DEFAULT_REMAINING),
      });
      if (isExpired && (provider ?? "shared") === "shared") {
        saveToStorage({
          provider: provider ?? "shared",
          apiKey: apiKey ?? null,
          remaining: DEFAULT_REMAINING,
          resetAt: Date.now() + WINDOW_MS,
        });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));

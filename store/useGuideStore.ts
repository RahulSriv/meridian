import { create } from "zustand";
import type { Guide, GuideStatus, SectionKey, StreamEvent } from "@/lib/types";

/**
 * Holds the guide currently being viewed and the progress of its generation.
 *
 * Sections stream in independently (TDD §6/§9), so we track which section keys
 * have arrived as well as the partial guide assembled so far. The actual stream
 * wiring lands in Sessions 4–5; this store defines the shape they plug into.
 */
interface GuideState {
  status: GuideStatus;
  /** Free-text label for the current pipeline stage (e.g. "Fetching commits"). */
  stage: string | null;
  /** Metadata + sections assembled so far. Null until the first event arrives. */
  guide: Partial<Guide> | null;
  /** Section keys that have finished streaming, in arrival order. */
  arrivedSections: SectionKey[];
  error: string | null;

  start: () => void;
  applyEvent: (event: StreamEvent) => void;
  setError: (message: string) => void;
  setComplete: () => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as GuideStatus,
  stage: null,
  guide: null,
  arrivedSections: [] as SectionKey[],
  error: null,
};

export const useGuideStore = create<GuideState>((set) => ({
  ...initialState,

  start: () => set({ ...initialState, status: "analyzing" }),

  applyEvent: (event) =>
    set((state) => {
      switch (event.type) {
        case "status":
          return { status: "analyzing", stage: event.stage };

        case "meta":
          return {
            status: "streaming",
            guide: { ...(state.guide ?? {}), ...event.guide },
          };

        case "section": {
          const sections = {
            ...((state.guide?.sections as Record<string, unknown>) ?? {}),
            [event.name]: event.content,
          };
          const arrived = state.arrivedSections.includes(event.name)
            ? state.arrivedSections
            : [...state.arrivedSections, event.name];
          return {
            status: "streaming",
            guide: { ...(state.guide ?? {}), sections: sections as Guide["sections"] },
            arrivedSections: arrived,
          };
        }

        case "error":
          return { status: "error", error: event.message };

        default:
          return state;
      }
    }),

  setError: (message) => set({ status: "error", error: message }),

  setComplete: () => set({ status: "complete" }),

  reset: () => set({ ...initialState }),
}));

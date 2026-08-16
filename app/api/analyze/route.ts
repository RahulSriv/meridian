import { NextRequest } from "next/server";
import { z } from "zod";
import { buildRepoContext } from "@/lib/analyzer";
import { streamGuide } from "@/lib/synthesizer";
import { encodeGuideId } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { SECTION_ORDER } from "@/lib/types";
import type { StreamEvent, Provider } from "@/lib/types";

const RequestSchema = z.object({
  repoUrl: z.string().url(),
  apiKey: z.string().nullish(),
  provider: z.enum(["shared", "gemini", "groq", "claude", "openai"]).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { repoUrl, apiKey, provider = "shared" } = parsed.data;

  // Rate limit only shared-key requests — BYOK draws on the caller's own key.
  if (provider === "shared") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Daily limit reached for the free tier. Try again tomorrow, or use your own API key (BYOK).", code: "RATE_LIMITED" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // The client can disconnect (navigation, abort, dev-server HMR teardown)
      // before this generator finishes. Once that happens the controller is
      // already closed, and enqueue()/close() on it throw — guard both so a
      // late write can't crash the handler and leave the client hanging with
      // no completion/error event.
      let closed = false;
      const emit = (event: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(JSON.stringify(event) + "\n"));
        } catch {
          closed = true;
        }
      };

      // Which phase we're in, so failures get an accurate message.
      let phase: "github" | "ai" = "github";

      try {
        // Phase 1: build GitHub context.
        // GitHub calls always use the server GITHUB_TOKEN (via makeOctokit's env
        // fallback) — never the client `apiKey`, which is the AI provider key and
        // is routed to the model in streamGuide() below.
        emit({ type: "status", stage: "Fetching repository data..." });
        const context = await buildRepoContext(repoUrl);

        // Phase 2: AI synthesis
        phase = "ai";
        emit({ type: "status", stage: "Generating guide..." });

        // Groq's strict json_schema mode occasionally emits a completion that
        // fails our schema validation (empty output, an enum value outside the
        // allowed set, etc.) — sampling variance, not a deterministic prompt
        // problem, since a retry with the identical prompt/context routinely
        // succeeds. Bounded retry rather than failing the whole request on the
        // first bad sample.
        const MAX_ATTEMPTS = 3;
        let guide: Awaited<ReturnType<typeof streamGuide>["object"]> | undefined;
        let lastAiError: unknown;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          // streamObject swallows streaming errors by default — capture via onError
          // so we can fail fast instead of hanging on result.object until the
          // client times out (~180s).
          let aiError: unknown = null;
          const result = streamGuide(context, provider as Provider, apiKey, (e) => {
            aiError = e;
          });

          // Drain partialObjectStream to drive LLM generation forward.
          // Emit section-start status events as each top-level key first appears.
          const sectionStarted = new Set<string>();
          for await (const partial of result.partialObjectStream) {
            if (aiError) break;
            const p = partial as Record<string, unknown>;
            for (const key of SECTION_ORDER) {
              if (!sectionStarted.has(key) && p[key] !== undefined) {
                sectionStarted.add(key);
                emit({ type: "status", stage: `Generating ${key}...` });
              }
            }
          }

          if (!aiError) {
            // Get the fully-validated final object now that the stream is drained
            guide = await result.object;
            break;
          }

          lastAiError = aiError;
          const retryable = /does not match the expected schema|failed to generate json/i.test(
            extractMessage(aiError)
          );
          if (!retryable || attempt === MAX_ATTEMPTS) break;
          emit({ type: "status", stage: "Retrying guide generation..." });
        }

        if (!guide) throw lastAiError;

        // Emit each section individually so the client can render progressively
        for (const key of SECTION_ORDER) {
          emit({ type: "section", name: key, content: guide[key] });
        }

        // Emit guide metadata — client uses this to mark completion
        emit({
          type: "meta",
          guide: {
            id: encodeGuideId(repoUrl),
            repoUrl,
            repoName: `${context.owner}/${context.repo}`,
            generatedAt: new Date().toISOString(),
            commitSha: context.recentCommits[0]?.sha ?? "",
          },
        });
      } catch (err) {
        const message = extractMessage(err);
        // Log the raw error server-side (onError no longer surfaces it to console).
        console.error(`[analyze] ${phase} phase failed:`, message, "\nraw:", err);
        emit({ type: "error", message: toUserMessage(message, phase) });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // Already closed (e.g. client disconnected) — nothing to do.
          }
        }
      }
    },
    cancel() {
      // Client disconnected (navigation, abort). Nothing to clean up here —
      // emit()'s try/catch already handles writes racing against this.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}

/** Pull a useful message string out of an Error, AI SDK error, or plain object. */
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (o.error && typeof o.error === "object") {
      const inner = o.error as Record<string, unknown>;
      if (typeof inner.message === "string") return inner.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err ?? "");
}

/** Map a raw error to a user-facing message, scoped to the phase that failed. */
function toUserMessage(message: string, phase: "github" | "ai"): string {
  if (phase === "github") {
    if (/not found|404/i.test(message)) return "Repository not found or private.";
    if (/rate.?limit|\b403\b/i.test(message)) return "GitHub API rate limit exceeded. Try again shortly.";
    if (/bad credentials|\b401\b/i.test(message)) return "Something went wrong fetching this repository. Please try again in a moment.";
    return "Couldn't fetch the repository from GitHub. Check the URL and try again.";
  }

  // AI synthesis phase
  if (/tokens per minute|\bTPM\b|too large|context length|maximum context/i.test(message)) {
    return "This repository is too large for the free tier's per-minute limit. Try a smaller repo, wait a minute, or use your own API key (BYOK) for higher limits.";
  }
  if (/rate.?limit|rate_limit|quota|RESOURCE_EXHAUSTED|\b429\b/i.test(message)) {
    return "The AI provider's rate limit was hit. Wait a moment and try again, or use your own API key (BYOK).";
  }
  if (/api key|invalid.*key|unauthor|permission|\b401\b|\b403\b/i.test(message)) {
    return "The AI provider rejected the API key. Check your key in settings (the “Connect AI” panel).";
  }
  return "Guide generation failed. Please try again.";
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a GitHub repo URL (or "owner/repo" shorthand) into its parts.
 * Returns null when the input isn't a recognisable public GitHub repo.
 */
export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Shorthand: "owner/repo"
  const shorthand = /^([\w.-]+)\/([\w.-]+)$/.exec(trimmed);
  if (shorthand) {
    return { owner: shorthand[1], repo: stripGitSuffix(shorthand[2]) };
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!/github\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const [owner, repo] = segments;
    return { owner, repo: stripGitSuffix(repo) };
  } catch {
    return null;
  }
}

function stripGitSuffix(repo: string): string {
  return repo.replace(/\.git$/i, "");
}

// Isomorphic base64 — works in both the browser (btoa/atob) and Node (Buffer).
function toBase64(input: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa(unescape(encodeURIComponent(input)));
  }
  return Buffer.from(input, "utf-8").toString("base64");
}

function fromBase64(input: string): string {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return decodeURIComponent(escape(window.atob(input)));
  }
  return Buffer.from(input, "base64").toString("utf-8");
}

/** Encode a repo URL into a URL-safe id for the /guide/[id] route. */
export function encodeGuideId(repoUrl: string): string {
  return toBase64(repoUrl)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a /guide/[id] segment back into the original repo URL. */
export function decodeGuideId(id: string): string | null {
  try {
    const normalised = id.replace(/-/g, "+").replace(/_/g, "/");
    return fromBase64(normalised);
  } catch {
    return null;
  }
}

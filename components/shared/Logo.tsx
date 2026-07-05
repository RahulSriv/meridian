import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-7", className)}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="11" stroke="var(--border-strong)" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="4.4" ry="11" stroke="var(--accent-default)" strokeWidth="1.5" />
      <line x1="16" y1="3.5" x2="16" y2="28.5" stroke="var(--accent-default)" strokeWidth="1.5" />
      <line x1="5" y1="16" x2="27" y2="16" stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-heading-lg font-bold tracking-tight text-text-primary">Meridian</span>
    </span>
  );
}

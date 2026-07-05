import { LogoMark } from "@/components/shared/Logo";
import { GithubIcon } from "@/components/shared/GithubIcon";

export function Footer() {
  return (
    <footer className="border-t border-border-default mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-body-sm text-text-muted">
          <LogoMark className="w-5 h-5" />
          <span>Meridian — your reference line for any codebase.</span>
        </div>
        <div className="flex items-center gap-5 text-body-sm text-text-secondary">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-text-primary transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
            Source
          </a>
          <span className="text-text-muted">MIT licensed</span>
          <span className="text-text-muted">No login · No tracking</span>
        </div>
      </div>
    </footer>
  );
}

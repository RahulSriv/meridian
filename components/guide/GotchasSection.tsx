import type { GuideSections, Severity, GotchaSource } from "@/lib/types";

type Props = { data: GuideSections["gotchas"] };

const SEVERITY_STYLES: Record<Severity, string> = {
  high:   "text-severity-high   border-severity-high/30   bg-severity-high/10",
  medium: "text-severity-medium border-severity-medium/30 bg-severity-medium/10",
  low:    "text-severity-low    border-severity-low/30    bg-severity-low/10",
};

const SOURCE_LABELS: Record<GotchaSource, string> = {
  todo:        "TODO",
  fixme:       "FIXME",
  git_history: "git history",
  pr_comment:  "PR comment",
};

export function GotchasSection({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map((gotcha, i) => (
        <div key={i} className="rounded-lg border border-border-default bg-bg-elevated p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-body-md text-text-primary font-medium">{gotcha.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-label-md ${SEVERITY_STYLES[gotcha.severity]}`}>
                {gotcha.severity}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full border border-border-default bg-bg-surface text-label-md text-text-muted">
                {SOURCE_LABELS[gotcha.source]}
              </span>
            </div>
          </div>
          <p className="text-body-sm text-text-secondary">{gotcha.description}</p>
        </div>
      ))}
    </div>
  );
}

import { Clock } from "lucide-react";
import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["readingOrder"] };

export function ReadingOrderSection({ data }: Props) {
  return (
    <ol className="space-y-3">
      {data.map((item, i) => (
        <li key={i} className="flex items-start gap-4 rounded-lg border border-border-default bg-bg-elevated px-4 py-3">
          <span className="text-label-lg text-accent-default font-mono shrink-0 w-6 text-right">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-body-sm font-mono text-text-primary break-all">{item.file}</p>
            <p className="text-body-sm text-text-secondary">{item.reason}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-label-md">{item.timeEstimate}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

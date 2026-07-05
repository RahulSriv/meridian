import { User, FileText } from "lucide-react";
import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["ownership"] };

export function OwnershipSection({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map((area, i) => (
        <div key={i} className="rounded-lg border border-border-default bg-bg-elevated p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-body-md text-text-primary font-medium">{area.area}</p>
            {area.primaryOwner && (
              <div className="flex items-center gap-1.5 text-text-muted shrink-0">
                <User className="w-3.5 h-3.5" />
                <span className="text-label-lg">{area.primaryOwner}</span>
              </div>
            )}
          </div>
          {area.files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {area.files.map((file, j) => (
                <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border-default bg-bg-surface">
                  <FileText className="w-3 h-3 text-text-muted shrink-0" />
                  <span className="text-label-md text-text-muted font-mono break-all">{file}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

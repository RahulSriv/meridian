import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["techStack"] };

export function TechStackSection({ data }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {data.map((item, i) => (
        <div key={i} className="rounded-lg border border-border-default bg-bg-elevated p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-body-md text-text-primary font-medium">{item.name}</span>
            {item.version && (
              <span className="px-1.5 py-0.5 rounded-md bg-bg-surface border border-border-default text-label-md text-text-muted font-mono">
                {item.version}
              </span>
            )}
          </div>
          <p className="text-body-sm text-text-secondary">{item.whyUsedHere}</p>
        </div>
      ))}
    </div>
  );
}

import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["architecture"] };

export function ArchitectureSection({ data }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-body-md text-text-secondary leading-relaxed whitespace-pre-line">
        {data.narrative}
      </p>
      {data.keyPatterns.length > 0 && (
        <div className="space-y-2">
          <p className="text-label-lg text-text-primary">Key patterns</p>
          <ul className="space-y-2">
            {data.keyPatterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-default shrink-0" />
                <span className="text-body-md text-text-secondary">{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

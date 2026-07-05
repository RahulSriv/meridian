import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["overview"] };

export function OverviewSection({ data }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-body-md text-text-secondary leading-relaxed whitespace-pre-line">
        {data.summary}
      </p>
      {data.whatItIsNot && (
        <div className="rounded-lg border border-border-default bg-bg-elevated px-4 py-3">
          <p className="text-body-sm text-text-muted italic">{data.whatItIsNot}</p>
        </div>
      )}
    </div>
  );
}

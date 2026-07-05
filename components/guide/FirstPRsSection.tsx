import type { GuideSections, Difficulty } from "@/lib/types";

type Props = { data: GuideSections["firstPRs"] };

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy:   "text-difficulty-easy   border-difficulty-easy/30   bg-difficulty-easy/10",
  medium: "text-difficulty-medium border-difficulty-medium/30 bg-difficulty-medium/10",
  hard:   "text-difficulty-hard   border-difficulty-hard/30   bg-difficulty-hard/10",
};

export function FirstPRsSection({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.map((pr, i) => (
        <div key={i} className="rounded-lg border border-border-default bg-bg-elevated p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-body-md text-text-primary font-medium">{pr.title}</p>
            <span className={`inline-flex px-2 py-0.5 rounded-full border text-label-md shrink-0 ${DIFFICULTY_STYLES[pr.difficulty]}`}>
              {pr.difficulty}
            </span>
          </div>
          <p className="text-body-sm text-text-secondary">{pr.description}</p>
          <p className="text-label-md text-text-muted">Area: {pr.area}</p>
        </div>
      ))}
    </div>
  );
}

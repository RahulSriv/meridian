import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["localSetup"] };

export function SetupSection({ data }: Props) {
  return (
    <ol className="space-y-4">
      {data.map((step, i) => (
        <li key={i} className="flex items-start gap-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full border border-accent-soft bg-accent-soft/20 flex items-center justify-center text-label-md text-accent-default font-mono">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-2 pt-0.5">
            <p className="text-body-md text-text-primary">{step.step}</p>
            {step.command && (
              <pre className="rounded-lg bg-bg-elevated border border-border-default px-4 py-3 text-code-md font-mono text-accent-default overflow-x-auto">
                <code>{step.command}</code>
              </pre>
            )}
            {step.note && (
              <p className="text-body-sm text-text-muted italic">{step.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

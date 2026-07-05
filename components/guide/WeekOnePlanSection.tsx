import { CheckSquare } from "lucide-react";
import type { GuideSections } from "@/lib/types";

type Props = { data: GuideSections["weekOnePlan"] };

function CheckList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-label-lg text-text-primary">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckSquare className="w-4 h-4 text-accent-default shrink-0 mt-0.5" />
            <span className="text-body-sm text-text-secondary">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WeekOnePlanSection({ data }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border-default bg-bg-elevated p-4">
        <CheckList items={data.day1} label="Day 1" />
      </div>
      <div className="rounded-lg border border-border-default bg-bg-elevated p-4">
        <CheckList items={data.week1} label="Week 1" />
      </div>
    </div>
  );
}

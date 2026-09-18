import { ListChecks } from "lucide-react";

interface AssumptionsPanelProps {
  assumptions: string[];
  /** Starts expanded on the result page, collapsed when embedded in the form. */
  defaultOpen?: boolean;
}

export default function AssumptionsPanel({ assumptions, defaultOpen = false }: AssumptionsPanelProps) {
  if (assumptions.length === 0) return null;

  return (
    <details className="paper-card group p-5 sm:p-8" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-light text-emerald">
            <ListChecks size={16} strokeWidth={2.25} />
          </span>
          <span className="font-display text-[16px] font-semibold text-ink">Assumptions &amp; Methodology</span>
        </span>
        <span className="text-[12px] font-medium text-ink-faint transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-4">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Companies structure CTC differently, so PAYLENS is transparent about exactly what it
          assumed to reach this result:
        </p>
        <ul className="mt-3 space-y-2.5">
          {assumptions.map((note) => (
            <li key={note} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

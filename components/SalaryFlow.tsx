import { ArrowRight, ArrowDown } from "lucide-react";
import type { SalaryResult } from "@/types/salary";
import { cn, formatINR } from "@/lib/utils";

interface SalaryFlowProps {
  result: SalaryResult;
}

type StageKind = "value" | "subtract" | "result";

interface Stage {
  label: string;
  amount: number;
  kind: StageKind;
  caption: string;
}

const kindStyles: Record<StageKind, { card: string; bar: string; label: string }> = {
  value: { card: "border-line bg-paper-raised", bar: "bg-ink/70", label: "text-ink-faint" },
  subtract: { card: "border-brick/25 bg-brick-light", bar: "bg-brick", label: "text-brick" },
  result: { card: "border-emerald/30 bg-emerald-light", bar: "bg-emerald", label: "text-emerald-dark" },
};

export default function SalaryFlow({ result }: SalaryFlowProps) {
  const { breakdown } = result;
  const ctc = breakdown.annualCTC || 1;

  const stages: Stage[] = [
    { label: "Annual CTC", amount: breakdown.annualCTC, kind: "value", caption: "What your offer letter says" },
    {
      label: "Gross Salary",
      amount: breakdown.grossSalary,
      kind: "value",
      caption: "Basic + HRA + Variable + Other — never exceeds CTC",
    },
    {
      label: "Deductions + Tax",
      amount: breakdown.totalDeductions,
      kind: "subtract",
      caption: "Employee PF + Professional Tax + Income Tax",
    },
    {
      label: "Take-Home",
      amount: breakdown.annualTakeHome,
      kind: "result",
      caption: "What reaches your bank account",
    },
  ];

  return (
    <div className="paper-card p-5 sm:p-8">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Salary Journey</p>
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-stretch md:gap-2">
        {stages.map((stage, i) => {
          const barPercent = Math.min(100, Math.max(4, (stage.amount / ctc) * 100));
          const styles = kindStyles[stage.kind];
          return (
            <div key={stage.label} className="flex flex-1 items-center gap-2 md:gap-2">
              <div className={cn("flex-1 rounded-xl border p-4", styles.card)}>
                <p className={cn("text-[11px] font-semibold uppercase tracking-wide", styles.label)}>
                  {stage.kind === "subtract" ? "− " : ""}
                  {stage.label}
                </p>
                <p className="mt-1.5 font-mono text-[16px] font-semibold tabular-nums text-ink sm:text-[17px]">
                  {formatINR(stage.amount)}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-ink-faint">{stage.caption}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                  <div
                    className={cn("h-full origin-left animate-grow-bar rounded-full", styles.bar)}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>

              {i < stages.length - 1 && (
                <div className="flex shrink-0 items-center justify-center text-ink-faint md:rotate-0">
                  <ArrowDown size={16} className="md:hidden" />
                  <ArrowRight size={16} className="hidden md:block" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

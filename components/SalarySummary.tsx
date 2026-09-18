import type { SalaryResult } from "@/types/salary";
import { formatINR, formatPercent } from "@/lib/utils";

interface SalarySummaryProps {
  result: SalaryResult;
}

export default function SalarySummary({ result }: SalarySummaryProps) {
  const { breakdown, tax, percentOfCTCReachingEmployee } = result;

  return (
    <div className="paper-card perforated-top overflow-hidden bg-ink text-paper">
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-paper/60">
            Here&rsquo;s what actually reaches you
          </p>
          <p className="mt-2 break-words font-display text-[42px] font-semibold leading-none tracking-tight sm:text-[56px]">
            {formatINR(breakdown.monthlyTakeHome)}
            <span className="ml-1.5 font-sans text-[16px] font-medium text-paper/50">/ month</span>
          </p>
          <p className="mt-4 text-[15px] text-paper/70">
            Annual Take-Home:{" "}
            <span className="font-mono font-semibold text-paper">{formatINR(breakdown.annualTakeHome)}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:border-l md:border-paper/15 md:pl-8">
          <div>
            <p className="font-mono text-[24px] font-semibold tabular-nums">
              {formatPercent(percentOfCTCReachingEmployee)}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-paper/60">of your CTC reaches your bank account</p>
          </div>
          <div>
            <p className="font-mono text-[24px] font-semibold tabular-nums">
              {formatPercent(tax.effectiveTaxRatePercent)}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-paper/60">effective tax rate on taxable income</p>
          </div>
        </div>
      </div>
    </div>
  );
}

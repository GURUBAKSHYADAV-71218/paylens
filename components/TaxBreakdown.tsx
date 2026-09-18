import { Info } from "lucide-react";
import type { SalaryResult } from "@/types/salary";
import { cn, formatINR, formatPercent } from "@/lib/utils";

interface TaxBreakdownProps {
  result: SalaryResult;
}

interface Row {
  label: string;
  value: string;
  negative?: boolean;
  emphasis?: boolean;
}

export default function TaxBreakdown({ result }: TaxBreakdownProps) {
  const { tax } = result;
  const regimeLabel = tax.regime === "new" ? "New Regime" : "Old Regime";

  const rows: Row[] = [
    { label: "Tax Regime", value: regimeLabel },
    { label: "Taxable Income", value: formatINR(tax.taxableIncome) },
    { label: "Standard Deduction", value: formatINR(tax.standardDeduction), negative: true },
    { label: "Tax Before Rebate/Cess", value: formatINR(tax.taxBeforeRebate) },
    { label: "Section 87A Rebate", value: formatINR(tax.rebate), negative: true },
    ...(tax.surcharge > 0 ? [{ label: "Surcharge", value: formatINR(tax.surcharge) }] : []),
    { label: "Health & Education Cess", value: formatINR(tax.cess) },
    { label: "Estimated Final Tax", value: formatINR(tax.finalTax), emphasis: true },
    { label: "Effective Tax Rate", value: formatPercent(tax.effectiveTaxRatePercent), emphasis: true },
  ];

  return (
    <div className="paper-card p-5 sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Tax Breakdown</p>
        <p className="text-[11.5px] text-ink-faint">{tax.taxYear}</p>
      </div>

      <div className="mt-3 divide-y divide-line/70">
        {rows.map((row) => (
          <div key={row.label} className="ledger-row">
            <span className={cn("ledger-label", row.emphasis && "font-semibold text-ink")}>{row.label}</span>
            <span
              className={cn(
                "ledger-value",
                row.emphasis && "text-[16px] font-semibold",
                row.negative && "text-emerald-dark"
              )}
            >
              {row.negative && row.value !== "₹0" ? "− " : ""}
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2.5 rounded-lg bg-amber-light px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-amber" />
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          PAYLENS provides an estimate for educational purposes and is not an official government
          tax calculator. Tax rules may change, and this figure does not account for every
          exemption or deduction.
        </p>
      </div>
    </div>
  );
}

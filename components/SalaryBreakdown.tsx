import type { SalaryResult } from "@/types/salary";
import { cn, formatINR } from "@/lib/utils";

interface SalaryBreakdownProps {
  result: SalaryResult;
}

interface Row {
  label: string;
  value: number;
  emphasis?: boolean;
  negative?: boolean;
  note?: string;
}

export default function SalaryBreakdown({ result }: SalaryBreakdownProps) {
  const { breakdown } = result;

  const employerContributionNote =
    breakdown.employerPF > 0
      ? `incl. ${formatINR(breakdown.employerPF)} Employer PF`
      : "No employer PF assumed for this CTC";

  // Only show categories relevant to the selected structure — e.g. Variable
  // Pay is omitted entirely when it's zero, per PAYLENS' "only show what's
  // relevant" principle.
  const rows: Row[] = [
    { label: "Annual CTC", value: breakdown.annualCTC, emphasis: true },
    { label: "Employer Contributions", value: breakdown.totalEmployerContributions, note: employerContributionNote },
    { label: "Gross Salary", value: breakdown.grossSalary, emphasis: true },
    { label: "— Basic Salary", value: breakdown.basicSalary },
    { label: "— HRA", value: breakdown.hra },
    ...(breakdown.variablePay > 0 ? [{ label: "— Variable Pay / Bonus", value: breakdown.variablePay }] : []),
    { label: "— Other Allowances", value: breakdown.otherAllowances },
    { label: "Employee PF", value: breakdown.employeePF, negative: true },
    { label: "Professional Tax", value: breakdown.professionalTax, negative: true },
    { label: "Estimated Income Tax", value: breakdown.incomeTax, negative: true },
    { label: "Total Deductions", value: breakdown.totalDeductions, negative: true, emphasis: true },
    { label: "Annual Take-Home", value: breakdown.annualTakeHome, emphasis: true },
    { label: "Monthly Take-Home", value: breakdown.monthlyTakeHome, emphasis: true },
  ];

  return (
    <div className="paper-card p-5 sm:p-8">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Salary Breakdown</p>
      <div className="mt-3 divide-y divide-line/70">
        {rows.map((row) => (
          <div key={row.label} className="ledger-row">
            <span
              className={cn(
                "ledger-label",
                row.emphasis ? "font-semibold text-ink" : row.label.startsWith("—") && "pl-3 text-ink-faint"
              )}
            >
              {row.label}
              {row.note && <span className="ml-2 text-[11.5px] font-normal text-ink-faint">({row.note})</span>}
            </span>
            <span
              className={cn(
                "ledger-value",
                row.emphasis && "text-[16px] font-semibold",
                row.negative && "text-brick"
              )}
            >
              {row.negative && row.value > 0 ? "− " : ""}
              {formatINR(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

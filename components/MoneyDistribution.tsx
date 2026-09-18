"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SalaryResult, MoneyDistributionSlice } from "@/types/salary";
import { formatINR, formatPercent } from "@/lib/utils";

interface MoneyDistributionProps {
  result: SalaryResult;
}

const SLICE_COLORS = {
  takeHome: "#0E6E5C",
  tax: "#B14328",
  pf: "#C98A2C",
  professionalTax: "#7C8AA0",
  employerContribution: "#CFCABA",
};

function buildSlices(result: SalaryResult): MoneyDistributionSlice[] {
  const { breakdown } = result;
  const raw: MoneyDistributionSlice[] = [
    { name: "Take-Home", value: breakdown.annualTakeHome, color: SLICE_COLORS.takeHome },
    { name: "Estimated Income Tax", value: breakdown.incomeTax, color: SLICE_COLORS.tax },
    { name: "Employee PF", value: breakdown.employeePF, color: SLICE_COLORS.pf },
    { name: "Professional Tax", value: breakdown.professionalTax, color: SLICE_COLORS.professionalTax },
    {
      name: "Employer Contributions",
      value: breakdown.totalEmployerContributions,
      color: SLICE_COLORS.employerContribution,
    },
  ];
  // Percentages are computed against CTC below, so every slice here — by
  // construction of the calculation engine — sums to exactly 100% of CTC.
  return raw.filter((slice) => slice.value > 0);
}

export default function MoneyDistribution({ result }: MoneyDistributionProps) {
  const { breakdown, percentOfCTCReachingEmployee, ctcToTakeHomeDifference } = result;
  const slices = buildSlices(result);
  const total = breakdown.annualCTC || slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="paper-card p-5 sm:p-8">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
          Where Did Your Money Go?
        </p>
        <p className="font-display text-[22px] font-semibold text-ink">
          Your CTC: <span className="font-mono">{formatINR(breakdown.annualCTC)}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center">
        <div className="mx-auto h-[220px] w-full max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | string, name: number | string) => [
                  formatINR(Number(value)),
                  String(name),
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E4E1D8",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-3">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.name}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-[13.5px] font-medium tabular-nums text-ink">
                  {formatINR(slice.value)}
                </span>
                <span className="w-12 text-right font-mono text-[12px] text-ink-faint">
                  {formatPercent((slice.value / total) * 100)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-4">
        <div>
          <p className="text-[12px] text-ink-faint">CTC</p>
          <p className="mt-1 font-mono text-[17px] font-semibold tabular-nums">{formatINR(breakdown.annualCTC)}</p>
        </div>
        <div>
          <p className="text-[12px] text-ink-faint">Annual Take-Home</p>
          <p className="mt-1 font-mono text-[17px] font-semibold tabular-nums text-emerald-dark">
            {formatINR(breakdown.annualTakeHome)}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-ink-faint">Difference</p>
          <p className="mt-1 font-mono text-[17px] font-semibold tabular-nums text-brick">
            {formatINR(ctcToTakeHomeDifference)}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-ink-faint">% of CTC Reaching You</p>
          <p className="mt-1 font-mono text-[17px] font-semibold tabular-nums">
            {formatPercent(percentOfCTCReachingEmployee)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-ink-faint">
        This difference includes taxes, employee deductions and components that are part of CTC
        but are not directly paid as monthly cash salary.
      </p>
    </div>
  );
}

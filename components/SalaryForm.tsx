"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calculator, RotateCcw, Sparkles, SlidersHorizontal } from "lucide-react";
import type { SalaryInput, SalaryStructure, StructureMode, TaxRegime } from "@/types/salary";
import {
  DEFAULT_SALARY_INPUT,
  SALARY_STORAGE_KEY,
  buildQuickStructure,
  getBlockingError,
  computeSalaryResult,
} from "@/lib/salary";
import { cn, formatINR, formatPercent } from "@/lib/utils";
import Button from "./Button";
import AssumptionsPanel from "./AssumptionsPanel";

interface StructureFieldConfig {
  key: keyof SalaryStructure;
  label: string;
  hint: string;
}

const CASH_FIELDS: StructureFieldConfig[] = [
  { key: "basicSalary", label: "Basic Salary", hint: "Annual, before deductions" },
  { key: "hra", label: "HRA", hint: "House Rent Allowance, annual" },
  { key: "variablePay", label: "Variable Pay / Bonus", hint: "Annual, only if folded into CTC" },
  { key: "otherAllowances", label: "Other Allowances", hint: "Special allowance, annual" },
];

const EMPLOYER_AND_DEDUCTION_FIELDS: StructureFieldConfig[] = [
  { key: "employeePF", label: "Employee PF", hint: "Your annual contribution" },
  { key: "employerPF", label: "Employer PF", hint: "Employer's annual contribution (non-cash)" },
  { key: "professionalTax", label: "Professional Tax", hint: "Annual, deducted by employer" },
];

function isValidStoredInput(parsed: unknown): parsed is SalaryInput {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  return typeof p.annualCTC === "number" && typeof p.structure === "object" && p.structure !== null;
}

function loadInitialInput(): SalaryInput {
  if (typeof window === "undefined") return DEFAULT_SALARY_INPUT;
  try {
    const stored = window.localStorage.getItem(SALARY_STORAGE_KEY);
    if (!stored) return DEFAULT_SALARY_INPUT;
    const parsed = JSON.parse(stored);
    if (!isValidStoredInput(parsed)) return DEFAULT_SALARY_INPUT;
    return {
      annualCTC: parsed.annualCTC,
      taxRegime: parsed.taxRegime === "old" ? "old" : "new",
      structureMode: parsed.structureMode === "custom" ? "custom" : "quick",
      structure: { ...DEFAULT_SALARY_INPUT.structure, ...parsed.structure },
    };
  } catch {
    return DEFAULT_SALARY_INPUT;
  }
}

export default function SalaryForm() {
  const router = useRouter();
  const [input, setInput] = useState<SalaryInput>(DEFAULT_SALARY_INPUT);
  const [touched, setTouched] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount so server and client render match.
  useEffect(() => {
    setInput(loadInitialInput());
    setHydrated(true);
  }, []);

  const blockingError = useMemo(() => getBlockingError(input), [input]);
  const livePreview = useMemo(() => (blockingError ? null : computeSalaryResult(input)), [input, blockingError]);
  const quickPreviewStructure = useMemo(() => buildQuickStructure(input.annualCTC), [input.annualCTC]);

  function updateCTC(rawValue: string) {
    setTouched(true);
    const numeric = rawValue === "" ? 0 : Number(rawValue);
    setInput((prev) => ({ ...prev, annualCTC: Number.isFinite(numeric) ? numeric : prev.annualCTC }));
  }

  function updateStructureField(key: keyof SalaryStructure, rawValue: string) {
    setTouched(true);
    const numeric = rawValue === "" ? 0 : Number(rawValue);
    setInput((prev) => {
      const nextValue = Number.isFinite(numeric) ? numeric : prev.structure[key];
      return { ...prev, structure: { ...prev.structure, [key]: nextValue } as SalaryStructure };
    });
  }

  function updateRegime(regime: TaxRegime) {
    setInput((prev) => ({ ...prev, taxRegime: regime }));
  }

  function updateMode(mode: StructureMode) {
    setInput((prev) => {
      if (mode === prev.structureMode) return prev;
      // Switching into Customize Structure seeds the fields with the Quick
      // Estimate numbers, so the user tweaks a sensible starting point
      // instead of a blank/zeroed form.
      const structure = mode === "custom" ? buildQuickStructure(prev.annualCTC) : prev.structure;
      return { ...prev, structureMode: mode, structure };
    });
  }

  function resetToDefaults() {
    setInput(DEFAULT_SALARY_INPUT);
    setTouched(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (blockingError) return;
    window.localStorage.setItem(SALARY_STORAGE_KEY, JSON.stringify(input));
    router.push("/result");
  }

  if (!hydrated) {
    return (
      <div className="paper-card p-5 sm:p-8">
        <p className="text-[14px] text-ink-faint">Loading calculator…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        {/* Primary inputs */}
        <div className="paper-card p-5 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Primary Inputs</p>
              <h2 className="mt-1 font-display text-[24px] font-semibold text-ink">What&rsquo;s your CTC?</h2>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <label className="mt-6 block">
            <span className="text-[13px] font-medium text-ink">Annual CTC</span>
            <span className="relative mt-1.5 flex items-center">
              <span className="pointer-events-none absolute left-4 text-[18px] text-ink-faint">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={input.annualCTC === 0 ? "" : input.annualCTC}
                onChange={(e) => updateCTC(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-line bg-paper-raised py-3.5 pl-9 pr-4 font-mono text-[22px] font-semibold tabular-nums text-ink outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/15"
              />
            </span>
            <span className="mt-1.5 block text-[12px] text-ink-faint">Total cost to company, per year</span>
          </label>

          <div className="mt-6">
            <span className="text-[13px] font-medium text-ink">Tax Regime</span>
            <div className="mt-1.5 inline-flex rounded-lg border border-line bg-paper-raised p-1">
              {(["new", "old"] as TaxRegime[]).map((regime) => (
                <button
                  key={regime}
                  type="button"
                  onClick={() => updateRegime(regime)}
                  className={cn(
                    "rounded-md px-4 py-2 text-[13.5px] font-medium transition-colors",
                    input.taxRegime === regime ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {regime === "new" ? "New Regime" : "Old Regime"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structure mode */}
        <div className="paper-card p-5 sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Salary Structure</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateMode("quick")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                input.structureMode === "quick"
                  ? "border-emerald bg-emerald-light"
                  : "border-line bg-paper-raised hover:border-ink/25"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  input.structureMode === "quick" ? "bg-emerald text-white" : "bg-ink/5 text-ink-faint"
                )}
              >
                <Sparkles size={15} strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-ink">Quick Estimate</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">
                  Just enter your CTC — PAYLENS assumes a realistic structure.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateMode("custom")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                input.structureMode === "custom"
                  ? "border-emerald bg-emerald-light"
                  : "border-line bg-paper-raised hover:border-ink/25"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  input.structureMode === "custom" ? "bg-emerald text-white" : "bg-ink/5 text-ink-faint"
                )}
              >
                <SlidersHorizontal size={15} strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-ink">Customize Structure</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">
                  Enter your own Basic, HRA, PF and allowances.
                </span>
              </span>
            </button>
          </div>

          {input.structureMode === "quick" ? (
            <div className="mt-6 rounded-xl border border-line bg-paper px-4 py-4 sm:px-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                Assumed Structure for {formatINR(input.annualCTC)}
              </p>
              <div className="mt-2 divide-y divide-line/70">
                {(
                  [
                    ["Basic Salary", quickPreviewStructure.basicSalary],
                    ["HRA", quickPreviewStructure.hra],
                    ["Employer PF", quickPreviewStructure.employerPF],
                    ["Employee PF", quickPreviewStructure.employeePF],
                    ["Professional Tax", quickPreviewStructure.professionalTax],
                    ["Other Allowances", quickPreviewStructure.otherAllowances],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div key={label} className="ledger-row">
                    <span className="ledger-label">{label}</span>
                    <span className="ledger-value">{formatINR(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Cash Components</p>
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  {CASH_FIELDS.map((field) => (
                    <label key={field.key} className="block">
                      <span className="text-[13px] font-medium text-ink">{field.label}</span>
                      <span className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[14px] text-ink-faint">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          value={input.structure[field.key] === 0 ? "" : input.structure[field.key]}
                          onChange={(e) => updateStructureField(field.key, e.target.value)}
                          placeholder="0"
                          className="w-full rounded-lg border border-line bg-paper-raised py-2.5 pl-7 pr-3.5 font-mono text-[14.5px] tabular-nums text-ink outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/15"
                        />
                      </span>
                      <span className="mt-1 block text-[12px] text-ink-faint">{field.hint}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                  Employer &amp; Deductions
                </p>
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  {EMPLOYER_AND_DEDUCTION_FIELDS.map((field) => (
                    <label key={field.key} className="block">
                      <span className="text-[13px] font-medium text-ink">{field.label}</span>
                      <span className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3.5 text-[14px] text-ink-faint">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={100}
                          value={input.structure[field.key] === 0 ? "" : input.structure[field.key]}
                          onChange={(e) => updateStructureField(field.key, e.target.value)}
                          placeholder="0"
                          className="w-full rounded-lg border border-line bg-paper-raised py-2.5 pl-7 pr-3.5 font-mono text-[14.5px] tabular-nums text-ink outline-none transition-colors focus:border-emerald focus:ring-2 focus:ring-emerald/15"
                        />
                      </span>
                      <span className="mt-1 block text-[12px] text-ink-faint">{field.hint}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {touched && blockingError && (
            <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-brick-light px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brick" />
              <p className="text-[13px] leading-relaxed text-brick">{blockingError}</p>
            </div>
          )}

          {!blockingError && livePreview && livePreview.warnings.length > 0 && (
            <div className="mt-6 space-y-2">
              {livePreview.warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-2.5 rounded-lg bg-amber-light px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber" />
                  <p className="text-[13px] leading-relaxed text-ink-soft">{warning}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7">
            <Button type="submit" size="lg" icon={Calculator} disabled={!!blockingError} className="w-full sm:w-auto">
              Calculate Salary
            </Button>
          </div>
        </div>

        {input.structureMode === "quick" && livePreview && (
          <AssumptionsPanel assumptions={livePreview.assumptions} />
        )}
      </div>

      {/* Live preview */}
      <aside className="paper-card h-fit p-5 sm:p-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Live Preview</p>

        {blockingError ? (
          <div className="mt-4 rounded-xl border border-brick/25 bg-brick-light px-4 py-4">
            <p className="text-[13px] leading-relaxed text-brick">
              Fix the salary structure on the left to see a live preview.
            </p>
          </div>
        ) : livePreview ? (
          <div className="mt-4">
            <p className="font-mono text-[30px] font-semibold tabular-nums text-ink">
              {formatINR(livePreview.breakdown.monthlyTakeHome)}
              <span className="ml-1 font-sans text-[13px] font-medium text-ink-faint">/ month</span>
            </p>
            <p className="mt-1 text-[13px] text-ink-soft">
              {formatINR(livePreview.breakdown.annualTakeHome)} annually
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="ledger-row">
                <span className="ledger-label">Gross Salary</span>
                <span className="ledger-value">{formatINR(livePreview.breakdown.grossSalary)}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Total Deductions</span>
                <span className="ledger-value text-brick">
                  − {formatINR(livePreview.breakdown.totalDeductions)}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">% of CTC Reaching You</span>
                <span className="ledger-value">{formatPercent(livePreview.percentOfCTCReachingEmployee)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-faint">
          These figures update as you type. Hit &ldquo;Calculate Salary&rdquo; for the full
          breakdown — including tax, deductions, and a chart of where your CTC actually goes.
        </p>
      </aside>
    </form>
  );
}

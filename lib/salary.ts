/**
 * PAYLENS — salary engine
 *
 * Pure, deterministic functions that turn a SalaryInput into a full
 * SalaryResult. No AI, no network calls — just arithmetic, so the same
 * input always produces the same output.
 *
 * ── THE CORE INVARIANT ──────────────────────────────────────────────
 * Annual Take-Home must NEVER exceed Annual CTC, and Gross Salary must
 * NEVER exceed Annual CTC. This is enforced two ways:
 *
 *   1. UX layer (getBlockingError): in "Customize Structure" mode, if the
 *      user's Basic + HRA + Variable + Other + Employer PF add up to more
 *      than CTC, calculation is BLOCKED with a clear error. Nothing is
 *      silently clamped or hidden — the user must fix their numbers.
 *
 *   2. Engine layer (resolveStructure): "Quick Estimate" mode derives every
 *      component as a percentage of CTC, so the components mathematically
 *      cannot exceed CTC — there's no invalid state to block. As a second,
 *      independent safety net (in case of tampered localStorage or any
 *      future caller that skips validation), resolveStructure() also caps
 *      gross salary at CTC − Employer PF and scales the components down
 *      proportionally if it's ever asked to compute something invalid.
 *      In normal use this cap never engages.
 *
 * Because gross salary ≤ CTC and take-home ≤ gross salary (deductions are
 * floored at 0), Take-Home ≤ CTC is a mathematical guarantee, not a hope.
 *
 * ── MODEL USED (simplified, for education) ─────────────────────────
 *   Gross Salary          = Basic + HRA + Variable Pay + Other Allowances
 *   Total Employer Contrib = CTC − Gross Salary   (PF match, gratuity, etc.)
 *   Taxable Income         = Gross Salary − Standard Deduction
 *                            (− Professional Tax − PF-as-80C, old regime only)
 *   Income Tax              = slab-based estimate (see lib/tax.ts)
 *   Annual Take-Home        = Gross Salary − Employee PF − Professional Tax − Income Tax
 *   Monthly Take-Home       = Annual Take-Home / 12
 *
 * Real company salary structures vary — some fold PF, gratuity or bonuses
 * into CTC differently. Treat these numbers as an educational estimate.
 */

import type {
  SalaryInput,
  SalaryStructure,
  SalaryResult,
  SalaryBreakdown,
  StructureMode,
  TaxRegime,
} from "@/types/salary";
import { calculateTax, STANDARD_DEDUCTION, TAX_YEAR_LABEL } from "./tax";
import { formatINR } from "./utils";

const SECTION_80C_CAP = 150000;
/** Soft ceiling used only to surface a "that's a very large number" warning. */
const LARGE_VALUE_WARNING_THRESHOLD = 100000000; // ₹10 crore

/** Quick Estimate assumptions — every figure is a percentage of CTC (or of
 * Basic), so components can never sum to more than CTC. See getAssumptionNotes(). */
const QUICK_BASIC_PCT_OF_CTC = 0.4; // Basic ≈ 40% of CTC
const QUICK_HRA_PCT_OF_BASIC = 0.5; // HRA ≈ 50% of Basic (≈ 20% of CTC)
const QUICK_PF_PCT_OF_BASIC = 0.12; // Employer & Employee PF ≈ 12% of Basic each
const QUICK_PROFESSIONAL_TAX_ANNUAL = 2400; // Common state-level maximum

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampNonNegative(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? round(num) : 0;
}

/**
 * Derives a full salary structure from CTC alone, using transparent,
 * percentage-based assumptions. By construction, Basic + HRA + Employer PF
 * can never exceed CTC (0.4 + 0.2 + 0.048 = 0.648, i.e. 64.8% of CTC), so
 * Other Allowances — the balancing figure — is always ≥ 0.
 */
export function buildQuickStructure(annualCTC: number): SalaryStructure {
  const ctc = Math.max(0, annualCTC || 0);
  const basicSalary = round(ctc * QUICK_BASIC_PCT_OF_CTC);
  const hra = round(basicSalary * QUICK_HRA_PCT_OF_BASIC);
  const employerPF = round(basicSalary * QUICK_PF_PCT_OF_BASIC);
  const employeePF = employerPF; // mirrored — common in practice
  const professionalTax = ctc > 0 ? QUICK_PROFESSIONAL_TAX_ANNUAL : 0;
  const variablePay = 0; // not assumed — varies too much by company/role
  const otherAllowances = round(Math.max(0, ctc - basicSalary - hra - variablePay - employerPF));

  return { basicSalary, hra, variablePay, otherAllowances, employeePF, employerPF, professionalTax };
}

/** Sanitizes a raw (possibly user-entered or tampered) structure — all fields non-negative. */
function sanitizeStructure(raw: Partial<SalaryStructure> | undefined | null): SalaryStructure {
  return {
    basicSalary: clampNonNegative(raw?.basicSalary),
    hra: clampNonNegative(raw?.hra),
    variablePay: clampNonNegative(raw?.variablePay),
    otherAllowances: clampNonNegative(raw?.otherAllowances),
    employeePF: clampNonNegative(raw?.employeePF),
    employerPF: clampNonNegative(raw?.employerPF),
    professionalTax: clampNonNegative(raw?.professionalTax),
  };
}

interface ResolvedStructure {
  structure: SalaryStructure;
  grossSalary: number;
  /** True if the raw structure would have exceeded CTC and had to be scaled
   * down. Should never happen in normal use — see module docblock. */
  overflow: boolean;
}

/**
 * Picks the Quick or Custom structure and guarantees the result is
 * mathematically consistent with CTC: grossSalary + employerPF ≤ annualCTC,
 * always. This is the engine-level safety net described in the module docs.
 */
export function resolveStructure(input: SalaryInput): ResolvedStructure {
  const base = input.structureMode === "custom" ? input.structure : buildQuickStructure(input.annualCTC);

  const rawGross = round(base.basicSalary + base.hra + base.variablePay + base.otherAllowances);
  const employerPF = round(base.employerPF);
  const maxGross = Math.max(0, round(input.annualCTC - employerPF));

  if (rawGross <= maxGross) {
    return { structure: base, grossSalary: rawGross, overflow: false };
  }

  // Defensive fallback only — scale cash components down proportionally so
  // the breakdown still sums correctly. In normal use, getBlockingError()
  // prevents an over-committed custom structure from ever reaching here.
  const scale = rawGross > 0 ? maxGross / rawGross : 0;
  const basicSalary = round(base.basicSalary * scale);
  const hra = round(base.hra * scale);
  const variablePay = round(base.variablePay * scale);
  const otherAllowances = round(Math.max(0, maxGross - basicSalary - hra - variablePay));

  return {
    structure: { ...base, basicSalary, hra, variablePay, otherAllowances },
    grossSalary: maxGross,
    overflow: true,
  };
}

/** Employer PF + any other non-cash CTC component (gratuity, insurance, etc.). */
export function calculateEmployerContributions(
  structure: SalaryStructure,
  grossSalary: number,
  annualCTC: number
): { employerPF: number; otherEmployerContributions: number; totalEmployerContributions: number } {
  const employerPF = round(structure.employerPF);
  const otherEmployerContributions = round(Math.max(0, annualCTC - grossSalary - employerPF));
  return {
    employerPF,
    otherEmployerContributions,
    totalEmployerContributions: round(employerPF + otherEmployerContributions),
  };
}

/** Employee PF + Professional Tax — deducted from gross before tax is paid. */
export function calculateEmployeeDeductions(structure: SalaryStructure): number {
  return round(Math.max(0, structure.employeePF) + Math.max(0, structure.professionalTax));
}

/** Estimated taxable income after standard deduction and (old regime) 80C/PT relief. */
export function calculateTaxableIncome(
  regime: TaxRegime,
  grossSalary: number,
  employeePF: number,
  professionalTax: number
): number {
  const standardDeduction = STANDARD_DEDUCTION[regime];
  let taxable = grossSalary - standardDeduction;

  if (regime === "old") {
    taxable -= Math.min(Math.max(0, employeePF), SECTION_80C_CAP);
    taxable -= Math.max(0, professionalTax);
  }

  return round(Math.max(0, taxable));
}

/** Gross Salary − Employee PF − Professional Tax − Income Tax, floored at 0. */
export function calculateAnnualTakeHome(grossSalary: number, employeeDeductions: number, incomeTax: number): number {
  return round(Math.max(0, grossSalary - employeeDeductions - incomeTax));
}

export function calculateMonthlyTakeHome(annualTakeHome: number): number {
  return Math.round(annualTakeHome / 12);
}

/** Non-blocking notices — the caller still calculates, just informs the user. */
function getSalaryWarnings(input: SalaryInput, structure: SalaryStructure): string[] {
  const warnings: string[] = [];

  if (input.annualCTC > LARGE_VALUE_WARNING_THRESHOLD) {
    warnings.push("That's a very large CTC — figures at this scale are approximate.");
  }

  if (structure.employeePF > structure.basicSalary && structure.basicSalary > 0) {
    warnings.push("Employee PF is unusually high relative to Basic Salary. Please confirm this figure.");
  }

  if (input.structureMode === "custom" && input.annualCTC > 0 && structure.variablePay > input.annualCTC * 0.5) {
    warnings.push("Variable Pay / Bonus is more than half your CTC — please double-check this figure.");
  }

  return warnings;
}

/**
 * Hard validation — returns a blocking error message if the structure is
 * mathematically impossible, or null if it's safe to calculate. This is
 * what stops "CTC ₹5,00,000, components ₹8,00,000" before any calculation
 * happens. Quick Estimate is always structurally valid by construction, so
 * this only does real work in "custom" mode.
 */
export function getBlockingError(input: SalaryInput): string | null {
  if (!Number.isFinite(input.annualCTC) || input.annualCTC <= 0) {
    return "Annual CTC must be greater than zero.";
  }

  if (input.structureMode !== "custom") return null;

  const s = input.structure;
  const fields: [string, number][] = [
    ["Basic Salary", s.basicSalary],
    ["HRA", s.hra],
    ["Variable Pay / Bonus", s.variablePay],
    ["Other Allowances", s.otherAllowances],
    ["Employee PF", s.employeePF],
    ["Employer PF", s.employerPF],
    ["Professional Tax", s.professionalTax],
  ];
  for (const [label, value] of fields) {
    if (!Number.isFinite(value)) return `${label} must be a valid number.`;
    if (value < 0) return `${label} cannot be negative.`;
  }

  const cashComponents = s.basicSalary + s.hra + s.variablePay + s.otherAllowances;
  const committedTotal = round(cashComponents + s.employerPF);

  if (committedTotal > input.annualCTC) {
    const excess = committedTotal - input.annualCTC;
    return `Your salary components exceed your CTC by ${formatINR(excess)}. Please review your salary structure.`;
  }

  return null;
}

/** Human-readable assumptions shown in the "Assumptions & Methodology" panel. */
export function getAssumptionNotes(input: SalaryInput, structure: SalaryStructure): string[] {
  const regimeLabel = input.taxRegime === "new" ? "New Regime" : "Old Regime";
  const taxNote = `Tax calculated for ${TAX_YEAR_LABEL} under the ${regimeLabel}.`;

  if (input.structureMode === "custom") {
    const notes = [
      taxNote,
      `Standard deduction of ${formatINR(STANDARD_DEDUCTION[input.taxRegime])} applied automatically.`,
    ];
    if (input.taxRegime === "old") {
      notes.push(
        `Employee PF is treated as a Section 80C deduction, capped at ${formatINR(SECTION_80C_CAP)}, plus Professional Tax relief.`
      );
    }
    notes.push("Your salary components are used exactly as entered — no assumptions applied.");
    return notes;
  }

  return [
    `Basic Salary assumed at 40% of CTC (${formatINR(structure.basicSalary)}).`,
    `HRA assumed at 50% of Basic — 20% of CTC (${formatINR(structure.hra)}).`,
    `Employer PF assumed at 12% of Basic (${formatINR(structure.employerPF)}), matched by an equal Employee PF contribution.`,
    `Professional Tax assumed at ${formatINR(structure.professionalTax)}/year, a typical state-level figure.`,
    `Other/Special Allowance is the balancing figure: CTC − Basic − HRA − Employer PF (${formatINR(
      structure.otherAllowances
    )}).`,
    "Variable Pay / Bonus is not assumed (₹0) — it varies too much by company and role. Switch to Customize Structure to add yours.",
    taxNote,
  ];
}

/** Runs the full pipeline and assembles a SalaryResult. This is the main entry point. */
export function computeSalaryResult(rawInput: SalaryInput): SalaryResult {
  const structureMode: StructureMode = rawInput?.structureMode === "custom" ? "custom" : "quick";
  const taxRegime: TaxRegime = rawInput?.taxRegime === "old" ? "old" : "new";
  const annualCTC = Math.max(0, Number.isFinite(rawInput?.annualCTC) ? rawInput.annualCTC : 0);
  const sanitizedStructure = sanitizeStructure(rawInput?.structure);

  const input: SalaryInput = { annualCTC, taxRegime, structureMode, structure: sanitizedStructure };

  const { structure, grossSalary, overflow } = resolveStructure(input);
  const { employerPF, otherEmployerContributions, totalEmployerContributions } = calculateEmployerContributions(
    structure,
    grossSalary,
    annualCTC
  );

  const employeeDeductions = calculateEmployeeDeductions(structure);
  const taxableIncome = calculateTaxableIncome(taxRegime, grossSalary, structure.employeePF, structure.professionalTax);
  const tax = calculateTax(taxableIncome, taxRegime);

  const totalDeductions = round(employeeDeductions + tax.finalTax);
  const annualTakeHome = calculateAnnualTakeHome(grossSalary, employeeDeductions, tax.finalTax);
  const monthlyTakeHome = calculateMonthlyTakeHome(annualTakeHome);

  const percentOfCTCReachingEmployee = annualCTC > 0 ? round((annualTakeHome / annualCTC) * 100) : 0;
  const ctcToTakeHomeDifference = round(Math.max(0, annualCTC - annualTakeHome));

  const breakdown: SalaryBreakdown = {
    annualCTC,
    basicSalary: structure.basicSalary,
    hra: structure.hra,
    variablePay: structure.variablePay,
    otherAllowances: structure.otherAllowances,
    grossSalary,
    employerPF,
    otherEmployerContributions,
    totalEmployerContributions,
    employeePF: structure.employeePF,
    professionalTax: structure.professionalTax,
    employeeDeductions,
    incomeTax: tax.finalTax,
    totalDeductions,
    annualTakeHome,
    monthlyTakeHome,
  };

  const warnings = getSalaryWarnings(input, structure);
  if (overflow) {
    warnings.unshift(
      "Your salary structure added up to more than your CTC. Figures below were scaled down proportionally so every number stays mathematically consistent — please review your inputs."
    );
  }

  return {
    input,
    breakdown,
    tax,
    percentOfCTCReachingEmployee,
    ctcToTakeHomeDifference,
    assumptions: getAssumptionNotes(input, structure),
    warnings,
  };
}

/**
 * localStorage key used to hand off input from the calculator page to the
 * result page. We persist the raw input (not the computed result) so the
 * result page always recomputes deterministically from lib/salary.ts.
 */
export const SALARY_STORAGE_KEY = "paylens:salary-input";

/** Sensible defaults so the calculator can be demoed immediately — Quick
 * Estimate is the default mode, per PAYLENS' input-experience design. */
export const DEFAULT_SALARY_INPUT: SalaryInput = {
  annualCTC: 1200000,
  taxRegime: "new",
  structureMode: "quick",
  structure: buildQuickStructure(1200000),
};

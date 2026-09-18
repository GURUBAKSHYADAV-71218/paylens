/**
 * PAYLENS — shared types
 *
 * These types define the shape of the data that flows through the
 * calculation engine (lib/salary.ts, lib/tax.ts) and into the UI.
 */

export type TaxRegime = "new" | "old";

/** Two ways to give PAYLENS a salary structure. */
export type StructureMode = "quick" | "custom";

/**
 * The individual salary components that make up a CTC. In "quick" mode
 * PAYLENS derives these from the CTC using transparent assumptions
 * (see lib/salary.ts's buildQuickStructure). In "custom" mode, the user
 * enters them directly.
 */
export interface SalaryStructure {
  /** Annual basic salary. */
  basicSalary: number;
  /** Annual HRA (House Rent Allowance). */
  hra: number;
  /** Annual variable pay / performance bonus folded into CTC. */
  variablePay: number;
  /** Annual "other allowances" — special allowance, etc. Also acts as the
   * balancing figure in Quick Estimate mode. */
  otherAllowances: number;
  /** Employee's annual contribution to Provident Fund. */
  employeePF: number;
  /** Employer's annual contribution to Provident Fund — non-cash, part of
   * CTC but never paid out as salary. */
  employerPF: number;
  /** Annual professional tax deducted by the employer. */
  professionalTax: number;
}

export interface SalaryInput {
  /** Total annual Cost To Company, in rupees. */
  annualCTC: number;
  /** Which income-tax regime to estimate tax under. */
  taxRegime: TaxRegime;
  /** Whether the salary structure is auto-estimated or user-entered. */
  structureMode: StructureMode;
  /**
   * The structure to use in "custom" mode. Ignored (and recomputed from
   * annualCTC) in "quick" mode — but always present so switching modes is
   * instant and lossless.
   */
  structure: SalaryStructure;
}

/**
 * The itemized tax calculation, isolated from the salary structure so it's
 * easy to inspect, test and update as tax rules change. Returned in full by
 * lib/tax.ts's calculateTax().
 */
export interface TaxBreakdown {
  regime: TaxRegime;
  /** Human-readable label for the tax year/rules this was computed under. */
  taxYear: string;
  taxableIncome: number;
  standardDeduction: number;
  /** Tax computed purely from the slabs, before rebate/surcharge/cess. */
  taxBeforeRebate: number;
  /** Section 87A rebate applied (0 if taxable income is above the threshold). */
  rebate: number;
  /** taxBeforeRebate − rebate, floored at 0. */
  taxAfterRebate: number;
  /** Simplified surcharge for very high incomes (0 for most taxpayers). */
  surcharge: number;
  /** Health & Education cess (4% of tax after rebate + surcharge). */
  cess: number;
  /** The final estimated tax payable: taxAfterRebate + surcharge + cess. */
  finalTax: number;
  /** finalTax / taxableIncome, as a percentage. 0 if taxableIncome is 0. */
  effectiveTaxRatePercent: number;
}

/**
 * The full itemized salary breakdown shown on the result page. Every
 * rupee value here is mutually consistent by construction:
 *   grossSalary + totalEmployerContributions = annualCTC
 *   annualTakeHome = grossSalary − totalDeductions   (never below 0)
 * See lib/salary.ts's computeSalaryResult() for the proof.
 */
export interface SalaryBreakdown {
  annualCTC: number;

  basicSalary: number;
  hra: number;
  variablePay: number;
  otherAllowances: number;
  /** basicSalary + hra + variablePay + otherAllowances. Guaranteed ≤ annualCTC. */
  grossSalary: number;

  employerPF: number;
  /** Any remaining non-cash CTC component (gratuity, insurance, etc.),
   * computed as annualCTC − grossSalary − employerPF. */
  otherEmployerContributions: number;
  /** employerPF + otherEmployerContributions. Equals annualCTC − grossSalary. */
  totalEmployerContributions: number;

  employeePF: number;
  professionalTax: number;
  /** employeePF + professionalTax (does not include income tax). */
  employeeDeductions: number;

  incomeTax: number;
  /** employeeDeductions + incomeTax — everything subtracted from gross salary. */
  totalDeductions: number;

  /** Guaranteed: 0 ≤ annualTakeHome ≤ grossSalary ≤ annualCTC. */
  annualTakeHome: number;
  /** annualTakeHome / 12, rounded to the nearest rupee. */
  monthlyTakeHome: number;
}

export interface SalaryResult {
  /** The sanitized input this result was computed from. */
  input: SalaryInput;
  /** The itemized salary breakdown. */
  breakdown: SalaryBreakdown;
  /** The itemized tax breakdown. */
  tax: TaxBreakdown;

  /** annualTakeHome / annualCTC, as a percentage. Always between 0 and 100. */
  percentOfCTCReachingEmployee: number;
  /** annualCTC − annualTakeHome. Always ≥ 0. */
  ctcToTakeHomeDifference: number;

  /** Human-readable list of assumptions used to compute this result —
   * shown in the "Assumptions & Methodology" panel. */
  assumptions: string[];
  /** Non-blocking notices surfaced to the user (e.g. unusually high PF). */
  warnings: string[];
}

export interface MoneyDistributionSlice {
  name: string;
  value: number;
  color: string;
}

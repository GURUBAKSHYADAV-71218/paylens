/**
 * PAYLENS — tax engine
 *
 * Deterministic, slab-based estimate of Indian individual income tax.
 * This is intentionally isolated from lib/salary.ts so the slabs, cess
 * and rebate rules can be updated in one place as tax law changes.
 *
 * TAX YEAR / RULES USED
 * FY 2025-26 (AY 2026-27) and FY 2026-27 (AY 2027-28) — New Regime slabs
 * introduced in Budget 2025 and left unchanged by Budget 2026. Old Regime
 * slabs are the long-standing rates that have applied for several years.
 * See TAX_YEAR_LABEL below, which is also what's shown in the UI.
 *
 * IMPORTANT — EDUCATIONAL ESTIMATE ONLY
 * This is a simplified model for a college mini project. It is not a
 * substitute for professional tax advice or an official government
 * calculator. Notable simplifications:
 *   - No marginal relief calculation at the Section 87A rebate cliff.
 *   - Surcharge is applied without marginal relief.
 *   - Only Section 80C (via employee PF) and the professional-tax
 *     deduction are modelled for the old regime — no HRA exemption,
 *     80D, home loan interest, etc.
 *   - Figures assume a resident individual taxpayer below 60 years.
 */

import type { TaxRegime, TaxBreakdown } from "@/types/salary";

interface TaxSlab {
  /** Upper bound of this slab, in rupees. `null` means "and above". */
  upTo: number | null;
  /** Tax rate applied to the portion of income inside this slab. */
  rate: number;
}

/** Tax year/rules this engine implements — shown directly in the UI. */
export const TAX_YEAR_LABEL = "FY 2025-26 / FY 2026-27 (Budget 2025 slabs)";

/**
 * New Tax Regime slabs — FY 2025-26 (AY 2026-27) and FY 2026-27 (AY 2027-28).
 * Introduced in Budget 2025, unchanged by Budget 2026.
 */
export const NEW_REGIME_SLABS: TaxSlab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: null, rate: 0.3 },
];

/**
 * Old Tax Regime slabs — unchanged for several years, resident individuals
 * below 60 years of age.
 */
export const OLD_REGIME_SLABS: TaxSlab[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: null, rate: 0.3 },
];

/** Flat standard deduction available to salaried taxpayers, by regime. */
export const STANDARD_DEDUCTION: Record<TaxRegime, number> = {
  new: 75000,
  old: 50000,
};

/** Section 87A rebate — zeroes out tax for taxable income under the threshold. */
export const REBATE_87A: Record<TaxRegime, { thresholdTaxableIncome: number; maxRebate: number }> = {
  new: { thresholdTaxableIncome: 1200000, maxRebate: 60000 },
  old: { thresholdTaxableIncome: 500000, maxRebate: 12500 },
};

/** Health & Education cess, applied on tax after rebate + surcharge. */
export const CESS_RATE = 0.04;

/** Simplified surcharge bands (no marginal relief modelled). */
const SURCHARGE_BANDS: { above: number; rate: number }[] = [
  { above: 20000000, rate: 0.25 },
  { above: 10000000, rate: 0.15 },
  { above: 5000000, rate: 0.1 },
];

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sums tax across slabs for a given taxable income. */
function computeSlabTax(taxableIncome: number, slabs: TaxSlab[]): number {
  let tax = 0;
  let lastLimit = 0;

  for (const slab of slabs) {
    const upper = slab.upTo === null ? taxableIncome : Math.min(slab.upTo, taxableIncome);
    if (upper > lastLimit) {
      tax += (upper - lastLimit) * slab.rate;
      lastLimit = upper;
    }
    if (slab.upTo !== null && taxableIncome <= slab.upTo) break;
  }

  return tax;
}

function computeSurchargeRate(taxableIncome: number): number {
  for (const band of SURCHARGE_BANDS) {
    if (taxableIncome > band.above) return band.rate;
  }
  return 0;
}

export function getSlabsForRegime(regime: TaxRegime): TaxSlab[] {
  return regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
}

/**
 * Runs the full tax pipeline for a given taxable income and regime, and
 * returns every intermediate figure (not just the final number) so the UI
 * can show a real itemized tax breakdown.
 *
 * Guarantees: every field is ≥ 0. Tax can never be negative.
 */
export function calculateTax(taxableIncome: number, regime: TaxRegime): TaxBreakdown {
  const safeIncome = Number.isFinite(taxableIncome) && taxableIncome > 0 ? round(taxableIncome) : 0;

  const slabs = getSlabsForRegime(regime);
  const taxBeforeRebate = round(computeSlabTax(safeIncome, slabs));

  // Section 87A rebate — fully or partially cancels tax below the threshold.
  const rebateConfig = REBATE_87A[regime];
  const rebate =
    safeIncome > 0 && safeIncome <= rebateConfig.thresholdTaxableIncome
      ? round(Math.min(taxBeforeRebate, rebateConfig.maxRebate))
      : 0;
  const taxAfterRebate = round(Math.max(0, taxBeforeRebate - rebate));

  // Simplified surcharge for very high incomes (no marginal relief).
  const surchargeRate = computeSurchargeRate(safeIncome);
  const surcharge = round(taxAfterRebate * surchargeRate);

  // Health & Education cess, on tax + surcharge.
  const cess = round((taxAfterRebate + surcharge) * CESS_RATE);

  const finalTax = Math.round(taxAfterRebate + surcharge + cess);
  const effectiveTaxRatePercent = safeIncome > 0 ? round((finalTax / safeIncome) * 100) : 0;

  return {
    regime,
    taxYear: TAX_YEAR_LABEL,
    taxableIncome: safeIncome,
    standardDeduction: STANDARD_DEDUCTION[regime],
    taxBeforeRebate,
    rebate,
    taxAfterRebate,
    surcharge,
    cess,
    finalTax,
    effectiveTaxRatePercent,
  };
}

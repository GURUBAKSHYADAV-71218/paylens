# PAYLENS

**Your CTC is not your salary.**

## Description

PAYLENS is a salary transparency web application for India. It explains the
gap between the number on an offer letter and the number that actually
lands in a bank account:

> CTC → Salary Structure → Gross Salary → Deductions & Tax → Actual Take-Home

It's built as a college mini project — a focused, polished demo, not a
production fintech product. There's no login, no database, and no backend:
every calculation runs as plain, deterministic TypeScript in the browser,
and nothing is ever sent anywhere.

## Features

- **Two-level input experience** — **Quick Estimate** (default): enter just
  your CTC and tax regime, and PAYLENS derives a realistic salary structure
  using transparent, percentage-based assumptions. **Customize Structure**
  (optional): enter your own Basic, HRA, Variable Pay, Employee/Employer PF
  and Professional Tax for a precise result.
- **Hard financial validation** — a Customize Structure that adds up to more
  than your CTC is *blocked*, with an exact explanation of the shortfall.
  Nothing is silently clamped or hidden.
- **Mathematical guarantee** — Take-Home can never exceed Gross Salary, and
  Gross Salary can never exceed CTC. This isn't just validated at the form —
  it's a property of the calculation engine itself (see
  [How The Calculation Works](#how-the-calculation-works)).
- **Live preview** — the calculator shows your estimated take-home updating
  in real time as you type, before you even hit Calculate.
- **Salary Journey** — a visual, receipt-style flow from CTC down to
  monthly take-home.
- **Salary Breakdown** — every line item (employer contributions, gross
  salary, Basic/HRA/Variable/Other, PF, professional tax, estimated tax,
  total deductions, take-home) laid out like an itemized ledger. Only
  categories relevant to your structure are shown.
- **Tax Breakdown** — regime, taxable income, standard deduction, tax before
  rebate, Section 87A rebate, surcharge (where applicable), cess, final tax,
  and effective rate — the full pipeline, not just a final number.
- **"Where Did Your Money Go?"** — a donut chart plus a CTC-vs-take-home
  comparison. Every slice is a percentage of CTC, and they always sum to
  100% for a valid result — never more.
- **Assumptions & Methodology** — a visible, collapsible panel explaining
  exactly what PAYLENS assumed (in Quick Estimate mode) or applied (tax
  rules, in both modes) to reach your result.
- Fully responsive, from a 375px phone up to a desktop dashboard layout.

## Tech Stack

- [Next.js](https://nextjs.org) 14 (App Router) + TypeScript
- React 18
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org) for the donut chart
- [Lucide React](https://lucide.dev) for icons
- Plain React state + `localStorage` for handoff between pages — no Redux,
  no database, no backend, no authentication

## Project Structure

```
app/
  page.tsx              Landing page
  calculator/page.tsx    Salary calculator (Quick Estimate / Customize Structure)
  result/page.tsx         Result dashboard
  layout.tsx               Root layout (fonts, Navbar, Footer)
  globals.css              Tailwind + PAYLENS design tokens

components/
  Navbar.tsx, Footer.tsx, Button.tsx, FeatureCard.tsx
  SalaryForm.tsx           The calculator form (two-level input + live preview)
  SalarySummary.tsx        Hero "monthly in-hand" card
  SalaryFlow.tsx           CTC → Take-Home waterfall visual
  SalaryBreakdown.tsx      Itemized salary ledger
  TaxBreakdown.tsx         Full tax pipeline: regime → rebate → cess → final tax
  MoneyDistribution.tsx    Donut chart + CTC vs take-home comparison
  AssumptionsPanel.tsx     Collapsible "Assumptions & Methodology" panel

lib/
  salary.ts                Salary calculation engine (structure, gross, deductions, take-home)
  tax.ts                    Isolated income-tax slab engine (easy to update)
  utils.ts                   Formatting helpers (₹ formatting, etc.)

types/
  salary.ts                  Shared TypeScript interfaces
```

## How to Run

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The calculator
opens in **Quick Estimate** mode with a sample CTC prefilled, so you can hit
**Calculate Salary** and see a full result immediately.

## How The Calculation Works

All calculation logic lives in `lib/salary.ts` and `lib/tax.ts` — plain,
pure functions, no AI involved, so the same input always produces the same
output. React components only *display* results; they never compute them.

### The core guarantee

**Take-Home can never exceed CTC, and Gross Salary can never exceed CTC.**
This is enforced two independent ways:

1. **At the input layer** (`getBlockingError`): in Customize Structure mode,
   if Basic + HRA + Variable Pay + Other Allowances + Employer PF add up to
   more than CTC, calculation is blocked entirely with a clear, specific
   error (e.g. *"Your salary components exceed your CTC by ₹3,21,600. Please
   review your salary structure."*). Nothing is silently clamped.

2. **At the engine layer** (`resolveStructure`): Quick Estimate derives
   every component as a fixed percentage of CTC, so it's *structurally
   impossible* to exceed CTC — there's no invalid state to even validate
   against. As a second, independent safety net, `resolveStructure` also
   caps gross salary at CTC − Employer PF no matter what's passed in. In
   normal use this cap never engages — it exists so the engine itself is
   provably safe even if a future caller (or corrupted `localStorage`) skips
   validation.

### The pipeline

1. **Salary Structure** — Quick Estimate assumptions (all percentages of
   CTC, so they can never overflow it):
   - Basic Salary ≈ 40% of CTC
   - HRA ≈ 50% of Basic (≈ 20% of CTC)
   - Employer PF ≈ 12% of Basic, matched by an equal Employee PF
   - Professional Tax ≈ ₹2,400/year (a typical state-level maximum)
   - Variable Pay is **not** assumed (₹0) — it varies too much by company
   - Other Allowances is the balancing figure: `CTC − Basic − HRA − Employer PF`

   In Customize Structure mode, these are simply the values you entered
   (after hard validation).

2. **Gross Salary** = Basic + HRA + Variable Pay + Other Allowances
3. **Total Employer Contributions** = CTC − Gross Salary (Employer PF +
   any other non-cash component such as gratuity or insurance)
4. **Taxable Income** = Gross Salary − Standard Deduction (and, under the
   Old Regime only, Professional Tax + Employee PF under Section 80C)
5. **Estimated Income Tax** — a full slab-based pipeline in `lib/tax.ts`:
   slab tax → Section 87A rebate → simplified surcharge → 4% cess → final tax
6. **Annual Take-Home** = Gross Salary − Employee PF − Professional Tax −
   Estimated Income Tax (floored at ₹0)
7. **Monthly Take-Home** = Annual Take-Home ÷ 12

### Tax year and rules

PAYLENS implements **FY 2025-26 / FY 2026-27** slabs (introduced in Budget
2025, unchanged by Budget 2026) — see `TAX_YEAR_LABEL` in `lib/tax.ts`, which
is also shown directly in the UI's Tax Breakdown card.

| | New Regime | Old Regime |
|---|---|---|
| Standard Deduction | ₹75,000 | ₹50,000 |
| Section 87A Rebate | Taxable income up to ₹12,00,000 | Taxable income up to ₹5,00,000 |
| Slabs | 0–4L: nil · 4–8L: 5% · 8–12L: 10% · 12–16L: 15% · 16–20L: 20% · 20–24L: 25% · 24L+: 30% | 0–2.5L: nil · 2.5–5L: 5% · 5–10L: 20% · 10L+: 30% |
| Cess | 4% on tax after rebate + surcharge | 4% on tax after rebate + surcharge |

**Simplifications** (documented in `lib/tax.ts`): no marginal relief at the
Section 87A cliff; surcharge is applied without marginal relief; only
Section 80C (via Employee PF) and the professional-tax deduction are
modelled for the Old Regime — no HRA exemption, 80D, home loan interest,
etc.; figures assume a resident individual taxpayer under 60.

### Disclaimer

PAYLENS provides an estimate for educational purposes and is not an
official government tax calculator or a substitute for professional tax
advice. Real company salary structures vary — some fold bonuses, gratuity
or NPS into CTC differently — so treat every figure here as an estimate,
not a payslip.

## Future Scope

Not implemented in this version — ideas for later:

- Payslip PDF analysis
- Salary offer comparison (compare two CTC offers side by side)
- Advanced tax planning (80C/80D optimization suggestions)
- Salary history tracking over time
- AI-powered salary explanation

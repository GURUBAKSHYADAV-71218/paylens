import { ArrowRight, Layers, Percent, Wallet, PenLine, Calculator, Compass } from "lucide-react";
import Button from "@/components/Button";
import FeatureCard from "@/components/FeatureCard";

const PREVIEW_STAGES = [
  { label: "CTC", value: "₹12,00,000", tone: "value" as const },
  { label: "Gross Salary", value: "₹11,42,400", tone: "value" as const },
  { label: "Deductions", value: "₹60,000", tone: "subtract" as const },
  { label: "Take-Home", value: "₹10,82,400", tone: "result" as const },
];

const FEATURES = [
  {
    icon: Layers,
    title: "CTC Breakdown",
    description:
      "See exactly how your Cost To Company splits into Basic, HRA, allowances and the parts that never touch your bank account.",
  },
  {
    icon: Percent,
    title: "Tax & Deduction Analysis",
    description:
      "Estimated income tax under the New or Old regime, plus PF and professional tax — each shown as its own line, not buried in a total.",
  },
  {
    icon: Wallet,
    title: "Actual In-Hand Salary",
    description:
      "A clear monthly and annual take-home figure — the number that actually lands in your account every month.",
  },
];

const STEPS = [
  {
    icon: PenLine,
    title: "Enter your CTC",
    description: "Just your CTC and tax regime — PAYLENS assumes a realistic salary structure automatically.",
  },
  {
    icon: Calculator,
    title: "PAYLENS calculates your salary",
    description: "Deterministic formulas turn your CTC into gross salary, tax, deductions and take-home.",
  },
  {
    icon: Compass,
    title: "Understand where your money goes",
    description: "A visual breakdown and chart show exactly which slice of your CTC goes where.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-rise">
            <p className="inline-flex items-center rounded-full border border-line bg-paper-raised px-3 py-1 text-[12.5px] font-medium text-ink-soft">
              See Where Your Salary Goes.
            </p>
            <h1 className="mt-5 text-balance font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[52px]">
              Your CTC is not your salary.
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
              See where your money actually goes. Understand your salary structure, taxes,
              deductions and real monthly take-home — in seconds.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/calculator" size="lg" icon={ArrowRight}>
                Calculate My Salary
              </Button>
              <Button href="/#how-it-works" variant="secondary" size="lg">
                How PAYLENS Works
              </Button>
            </div>
          </div>

          {/* Visual preview — a static receipt-style illustration */}
          <div className="paper-card perforated-top animate-rise p-6 sm:p-7" style={{ animationDelay: "120ms" }}>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              Quick Estimate — ₹12,00,000 CTC, New Regime
            </p>
            <div className="mt-4 divide-y divide-line/70">
              {PREVIEW_STAGES.map((stage) => (
                <div key={stage.label} className="flex items-center justify-between py-3.5">
                  <span className="text-[13.5px] text-ink-soft">
                    {stage.tone === "subtract" ? "− " : ""}
                    {stage.label}
                  </span>
                  <span
                    className={`font-mono text-[15px] font-semibold tabular-nums ${
                      stage.tone === "result"
                        ? "text-emerald-dark"
                        : stage.tone === "subtract"
                        ? "text-brick"
                        : "text-ink"
                    }`}
                  >
                    {stage.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
              PAYLENS&rsquo; default Quick Estimate for this CTC. Your own numbers depend on your
              salary structure and tax regime.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-emerald">What PAYLENS Shows You</p>
          <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            Three numbers your offer letter never explains.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={i + 1}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-emerald">How It Works</p>
            <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
              Three steps, no sign-up.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">
                    <step.icon size={16} strokeWidth={2.25} />
                  </span>
                  <span className="font-mono text-[13px] text-ink-faint">Step 0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-[18px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Button href="/calculator" size="lg" icon={ArrowRight}>
              Calculate My Salary
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

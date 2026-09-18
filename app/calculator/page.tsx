import type { Metadata } from "next";
import SalaryForm from "@/components/SalaryForm";

export const metadata: Metadata = {
  title: "Salary Calculator — PAYLENS",
  description: "Enter your CTC and salary components to see your estimated take-home salary.",
};

export default function CalculatorPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-emerald">Salary Calculator</p>
        <h1 className="mt-2 font-display text-[30px] font-semibold tracking-tight text-ink sm:text-[36px]">
          What does your CTC actually pay you?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Start with just your CTC — PAYLENS estimates a realistic salary structure
          automatically. Want more control? Switch to Customize Structure below. Nothing here is
          ever sent anywhere — every calculation runs right in your browser.
        </p>
      </div>

      <div className="mt-10">
        <SalaryForm />
      </div>
    </section>
  );
}

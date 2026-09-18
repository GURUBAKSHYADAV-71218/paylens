"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, PencilLine, RotateCcw } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import SalarySummary from "@/components/SalarySummary";
import SalaryFlow from "@/components/SalaryFlow";
import SalaryBreakdown from "@/components/SalaryBreakdown";
import MoneyDistribution from "@/components/MoneyDistribution";
import TaxBreakdown from "@/components/TaxBreakdown";
import AssumptionsPanel from "@/components/AssumptionsPanel";
import { SALARY_STORAGE_KEY, computeSalaryResult, getBlockingError } from "@/lib/salary";
import type { SalaryInput, SalaryResult } from "@/types/salary";

type Status = "loading" | "ready" | "empty" | "invalid";

function isValidStoredInput(parsed: unknown): parsed is SalaryInput {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  return typeof p.annualCTC === "number" && typeof p.structure === "object" && p.structure !== null;
}

export default function ResultPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SALARY_STORAGE_KEY);
      if (!stored) {
        setStatus("empty");
        return;
      }
      const parsedInput = JSON.parse(stored);
      if (!isValidStoredInput(parsedInput)) {
        setStatus("empty");
        return;
      }

      // Re-validate here too — not just in the form — so a tampered or
      // stale localStorage value can never produce an invalid result. This
      // is the same rule the calculator enforces: never calculate from a
      // salary structure that doesn't add up.
      const blockingError = getBlockingError(parsedInput);
      if (blockingError) {
        setInvalidReason(blockingError);
        setStatus("invalid");
        return;
      }

      setResult(computeSalaryResult(parsedInput));
      setStatus("ready");
    } catch {
      setStatus("empty");
    }
  }, []);

  if (status === "loading") {
    return (
      <section className="mx-auto flex max-w-6xl items-center justify-center px-5 py-24 sm:px-8">
        <p className="text-[14px] text-ink-faint">Loading your results…</p>
      </section>
    );
  }

  if (status === "invalid") {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-brick">Invalid Salary Structure</p>
        <h1 className="mt-2 font-display text-[26px] font-semibold text-ink">
          We can&rsquo;t calculate a result from this.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{invalidReason}</p>
        <div className="mt-7 flex justify-center">
          <Button href="/calculator" size="lg" icon={ArrowLeft} iconPosition="left">
            Fix My Inputs
          </Button>
        </div>
      </section>
    );
  }

  if (status === "empty" || !result) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">No Results Yet</p>
        <h1 className="mt-2 font-display text-[26px] font-semibold text-ink">
          We don&rsquo;t have any salary details to show.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
          Head to the calculator, enter (or keep the sample) salary numbers, and hit &ldquo;Calculate
          Salary&rdquo; to see your breakdown here.
        </p>
        <div className="mt-7 flex justify-center">
          <Button href="/calculator" size="lg" icon={ArrowLeft} iconPosition="left">
            Go to Calculator
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-emerald">Your Result</p>
          <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink sm:text-[34px]">
            Here&rsquo;s what actually reaches you.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/calculator"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink"
          >
            <PencilLine size={14} />
            Edit Inputs
          </Link>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(SALARY_STORAGE_KEY);
              window.location.href = "/calculator";
            }}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink"
          >
            <RotateCcw size={14} />
            Start New Calculation
          </button>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {result.warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2.5 rounded-lg bg-amber-light px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-[13px] leading-relaxed text-ink-soft">{warning}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6">
        <SalarySummary result={result} />
        <SalaryFlow result={result} />

        <div className="grid gap-6 lg:grid-cols-2">
          <SalaryBreakdown result={result} />
          <TaxBreakdown result={result} />
        </div>

        <MoneyDistribution result={result} />

        <AssumptionsPanel assumptions={result.assumptions} defaultOpen />
      </div>

      <p className="mt-10 max-w-2xl text-[12.5px] leading-relaxed text-ink-faint">
        PAYLENS provides an estimate for educational purposes and is not an official government tax
        calculator or professional tax advice. Actual company salary structures vary — your
        employer&rsquo;s exact CTC breakdown may differ from this model.
      </p>
    </section>
  );
}

import Link from "next/link";
import { ScanLine } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-paper">
                <ScanLine size={13} strokeWidth={2.25} />
              </span>
              <span className="font-display text-[16px] font-semibold tracking-tight">PAYLENS</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              Salary transparency made simple.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                Product
              </p>
              <ul className="mt-3 space-y-2 text-[14px] text-ink-soft">
                <li>
                  <Link href="/calculator" className="hover:text-ink">
                    Calculator
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-ink">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-faint">
            PAYLENS provides estimates for educational purposes and should not be treated as
            professional tax advice. Built as a college mini project — not an official government
            or financial service.
          </p>
        </div>
      </div>
    </footer>
  );
}

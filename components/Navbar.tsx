"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ScanLine } from "lucide-react";
import Button from "./Button";

const NAV_LINKS = [
  { label: "Calculator", href: "/calculator" },
  { label: "How It Works", href: "/#how-it-works" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper">
            <ScanLine size={16} strokeWidth={2.25} />
          </span>
          <span className="font-display text-[19px] font-semibold tracking-tight">PAYLENS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button href="/calculator" size="md">
            Calculate Salary
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper px-5 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-[15px] font-medium text-ink-soft hover:bg-ink/5 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3">
            <Button href="/calculator" size="md" className="w-full" >
              Calculate Salary
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

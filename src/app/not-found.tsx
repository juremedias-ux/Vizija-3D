import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Stran ne obstaja",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:py-32">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        Strani ni mogoče najti.
      </h1>
      <p className="mt-4 text-lg text-fg-muted">
        Povezava je morda napačna ali stran ne obstaja več.
      </p>
      <Link href="/" className={buttonClasses("primary", "lg", "mt-8")}>
        Na začetno stran
      </Link>
    </div>
  );
}

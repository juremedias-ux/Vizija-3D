"use client";

import { buttonClasses } from "@/components/ui/styles";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:py-32">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-fg">
        Prišlo je do napake.
      </h1>
      <p className="mt-4 text-lg text-fg-muted">
        Strani trenutno ni bilo mogoče prikazati. Poskusi znova.
      </p>
      <button
        type="button"
        onClick={reset}
        className={buttonClasses("primary", "lg", "mt-8")}
      >
        Poskusi znova
      </button>
    </div>
  );
}

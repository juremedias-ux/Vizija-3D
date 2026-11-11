"use client";

import type { Ref } from "react";

import {
  QUANTITY_MAX,
  QUANTITY_MIN,
  clampQuantity,
} from "@/lib/interest/validation";

interface QuantityInputProps {
  ref?: Ref<HTMLInputElement>;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  errorId: string;
  hintId: string;
  /** Med pošiljanjem: polje je samo za branje, gumba sta onemogočena. */
  locked?: boolean;
}

const stepButton =
  "inline-flex size-12 shrink-0 items-center justify-center text-fg transition-colors hover:bg-surface-3 hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:text-fg-subtle aria-disabled:opacity-50 aria-disabled:hover:bg-transparent focus-visible:outline-offset-[-2px]";

export function QuantityInput({
  ref,
  id,
  value,
  onChange,
  error,
  errorId,
  hintId,
  locked = false,
}: QuantityInputProps) {
  const numeric = /^\d+$/.test(value.trim()) ? Number(value.trim()) : NaN;
  const canDecrease =
    !locked && (Number.isNaN(numeric) || numeric > QUANTITY_MIN);
  const canIncrease =
    !locked && (Number.isNaN(numeric) || numeric < QUANTITY_MAX);

  function step(delta: number) {
    const base = Number.isNaN(numeric) ? QUANTITY_MIN - delta : numeric;
    onChange(String(clampQuantity(base + delta)));
  }

  const describedBy = [hintId, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`flex w-fit items-stretch overflow-hidden rounded-md border bg-surface-1 ${
        error ? "border-danger" : "border-line-strong"
      }`}
    >
      <button
        type="button"
        className={`${stepButton} border-r border-line-strong`}
        onClick={() => {
          if (canDecrease) step(-1);
        }}
        aria-disabled={!canDecrease}
        aria-label="Zmanjšaj količino"
        aria-controls={id}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 10h10" />
        </svg>
      </button>
      <input
        ref={ref}
        id={id}
        name="quantity"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        value={value}
        readOnly={locked}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (canIncrease) step(1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (canDecrease) step(-1);
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="w-16 bg-transparent text-center font-mono text-lg text-fg tabular-nums focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      />
      <button
        type="button"
        className={`${stepButton} border-l border-line-strong`}
        onClick={() => {
          if (canIncrease) step(1);
        }}
        aria-disabled={!canIncrease}
        aria-label="Povečaj količino"
        aria-controls={id}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 10h10M10 5v10" />
        </svg>
      </button>
    </div>
  );
}

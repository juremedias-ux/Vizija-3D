"use client";

import { type ReactNode, useId } from "react";

/** Skupni gradniki vmesnika Studia. */

export function Panel({
  title,
  children,
  actions,
  id,
}: {
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-[1.25rem] bg-surface-1 p-5 ring-1 ring-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={id}
          className="font-display text-lg font-semibold tracking-tight text-fg"
        >
          {title}
        </h2>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Notice({
  tone = "info",
  children,
  title,
}: {
  tone?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  title?: string;
}) {
  const styles = {
    info: "border-accent/30 bg-accent/5 text-fg",
    warning: "border-signal/40 bg-signal/5 text-fg",
    error: "border-danger/40 bg-danger/5 text-fg",
    success: "border-success/35 bg-success/5 text-fg",
  }[tone];
  const icon = {
    info: "text-accent",
    warning: "text-signal",
    error: "text-danger",
    success: "text-success",
  }[tone];
  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`mt-0.5 size-4 shrink-0 ${icon}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="10" cy="10" r="7.5" />
        <path
          d={
            tone === "success"
              ? "M6.5 10.5l2.5 2.5 4.5-5"
              : "M10 6v5M10 13.5v.5"
          }
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-0.5 text-fg-muted" : ""}>{children}</div>
      </div>
    </div>
  );
}

/** Izbira ene možnosti (radijski gumbi v obliki tabletk). */
export function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
  help,
  disabled,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  help?: string;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50">
      <legend className="text-sm font-medium text-fg">{legend}</legend>
      {help ? (
        <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{help}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-full bg-surface-2 px-3.5 py-2 text-sm text-fg-muted ring-1 ring-white/10 transition-colors has-[:checked]:bg-accent has-[:checked]:font-medium has-[:checked]:text-accent-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent hover:text-fg"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function StatusPill({
  status,
}: {
  status: "ok" | "info" | "opozorilo" | "napaka";
}) {
  const map = {
    ok: { label: "V redu", cls: "bg-success/15 text-success" },
    info: { label: "Nasvet", cls: "bg-accent/15 text-accent" },
    opozorilo: { label: "Opozorilo", cls: "bg-signal/15 text-signal" },
    napaka: { label: "Težava", cls: "bg-danger/15 text-danger" },
  }[status];
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map.cls}`}
    >
      {map.label}
    </span>
  );
}

export const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.08] px-5 text-sm font-medium text-fg ring-1 ring-white/15 ring-inset transition-colors hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50";

export const smallButton =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-sm text-fg ring-1 ring-white/10 ring-inset transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50";

export const fieldInput =
  "block w-full min-h-11 rounded-xl border border-white/10 bg-surface-2 px-3.5 text-base text-fg placeholder:text-fg-subtle hover:border-white/20 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";

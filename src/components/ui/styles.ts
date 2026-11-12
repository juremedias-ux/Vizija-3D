/** Skupni razredi za gumbe in povezave v obliki gumbov. */

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "bg-white/[0.08] text-fg ring-1 ring-white/15 ring-inset hover:bg-white/[0.14]",
  ghost: "text-fg-muted hover:text-fg",
} as const;

const sizes = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-7 text-base",
} as const;

export function buttonClasses(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  extra = "",
): string {
  return [base, variants[variant], sizes[size], extra]
    .filter(Boolean)
    .join(" ");
}

export const inputClasses =
  "block w-full min-h-12 rounded-xl border border-white/10 bg-surface-2 px-4 text-base text-fg placeholder:text-fg-subtle transition-colors hover:border-white/20 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger";

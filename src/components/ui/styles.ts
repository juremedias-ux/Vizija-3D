/** Skupni razredi za gumbe in povezave v obliki gumbov. */

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-line-strong bg-transparent text-fg hover:border-accent hover:text-accent",
  ghost: "text-fg-muted hover:text-fg",
} as const;

const sizes = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
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
  "block w-full min-h-12 rounded-md border border-line-strong bg-surface-1 px-3.5 text-base text-fg placeholder:text-fg-subtle transition-colors hover:border-fg-subtle focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger";

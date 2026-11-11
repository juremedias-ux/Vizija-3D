import type { ReactNode } from "react";

type Tone = "signal" | "accent" | "neutral";

const tones: Record<Tone, { box: string; dot: string }> = {
  signal: {
    box: "border-signal/40 bg-signal/10 text-signal",
    dot: "bg-signal",
  },
  accent: {
    box: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  neutral: {
    box: "border-line-strong bg-surface-2 text-fg-muted",
    dot: "bg-fg-subtle",
  },
};

export function Badge({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const style = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs leading-5 font-medium tracking-wide ${style.box}`}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${style.dot}`}
        />
      ) : null}
      {children}
    </span>
  );
}

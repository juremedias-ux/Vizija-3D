import type { ReactNode } from "react";

export function SectionIntro({
  index,
  label,
  title,
  titleId,
  children,
  aside,
}: {
  index: string;
  label: string;
  title: ReactNode;
  titleId: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className={aside ? "lg:col-span-8" : "lg:col-span-12"}>
        <p className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-accent uppercase">
          <span aria-hidden="true">{index}</span>
          <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
          <span>{label}</span>
        </p>
        <h2
          id={titleId}
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl lg:text-5xl"
        >
          {title}
        </h2>
        {children ? (
          <div className="mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
            {children}
          </div>
        ) : null}
      </div>
      {aside ? (
        <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>
      ) : null}
    </div>
  );
}

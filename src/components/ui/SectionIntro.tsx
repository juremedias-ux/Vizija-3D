import type { ReactNode } from "react";

/** Uvod razdelka: nadnaslov, velik naslov in besedilo; ob drsenju se razkrije. */
export function SectionIntro({
  eyebrow,
  title,
  titleId,
  children,
  aside,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  titleId: string;
  children?: ReactNode;
  aside?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div
      className={
        centered
          ? "mx-auto max-w-4xl text-center"
          : "grid gap-8 lg:grid-cols-12 lg:items-end"
      }
    >
      <div
        className={centered ? "" : aside ? "lg:col-span-8" : "lg:col-span-12"}
      >
        <p className="reveal text-base font-semibold text-accent sm:text-lg">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className="reveal mt-3 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-fg"
        >
          {title}
        </h2>
        {children ? (
          <div
            className={`reveal mt-6 text-lg leading-relaxed text-fg-muted sm:text-xl ${
              centered ? "mx-auto max-w-2xl" : "max-w-2xl"
            }`}
          >
            {children}
          </div>
        ) : null}
      </div>
      {aside ? (
        <div className="reveal lg:col-span-4 lg:justify-self-end">{aside}</div>
      ) : null}
    </div>
  );
}

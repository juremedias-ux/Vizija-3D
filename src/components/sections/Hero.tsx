import Link from "next/link";

import { HeroComposition } from "@/components/graphics/HeroComposition";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/styles";
import { HERO_HEADLINE_LINES, HERO_LEAD } from "@/content/copy";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-naslov"
      className="relative isolate overflow-hidden border-b border-line"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-grid mask-radial opacity-80"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8 lg:pt-24 lg:pb-24">
        <div className="lg:col-span-7">
          <ul className="flex flex-wrap gap-2" aria-label="Stanje razvoja">
            <li>
              <Badge tone="signal">Izdelki v razvoju</Badge>
            </li>
            <li>
              <Badge tone="accent">Vizualizacija prostora prihaja</Badge>
            </li>
          </ul>

          <h1
            id="hero-naslov"
            className="mt-7 font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-fg min-[400px]:text-5xl sm:text-6xl xl:text-7xl"
          >
            {HERO_HEADLINE_LINES.map((line, index) => (
              <span
                key={line}
                className={
                  index === HERO_HEADLINE_LINES.length - 1
                    ? "block text-accent"
                    : "block"
                }
              >
                {line}
                {index < HERO_HEADLINE_LINES.length - 1 ? " " : null}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted">
            {HERO_LEAD}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="#izdelki" className={buttonClasses("primary", "lg")}>
              Razišči izdelke
              <span aria-hidden="true">↓</span>
            </Link>
            <Link
              href="#vizualizacija"
              className={buttonClasses("secondary", "lg")}
            >
              Oglej si vizijo platforme
            </Link>
          </div>
        </div>

        <figure className="relative lg:col-span-5">
          <div className="relative rounded-xl border border-line bg-surface-1/80 p-4 sm:p-6">
            <span
              aria-hidden="true"
              className="absolute top-3 left-3 size-3 border-t border-l border-accent/70"
            />
            <span
              aria-hidden="true"
              className="absolute top-3 right-3 size-3 border-t border-r border-accent/70"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-3 left-3 size-3 border-b border-l border-accent/70"
            />
            <span
              aria-hidden="true"
              className="absolute right-3 bottom-3 size-3 border-r border-b border-accent/70"
            />
            <HeroComposition />
          </div>
          <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-xs text-fg-subtle">
            <span>Konceptna grafika</span>
            <span aria-hidden="true">Sloj za slojem</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

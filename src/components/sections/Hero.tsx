import Link from "next/link";
import type { CSSProperties } from "react";

import { HeroComposition } from "@/components/graphics/HeroComposition";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/styles";
import { HERO_HEADLINE_LINES, HERO_LEAD } from "@/content/copy";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Hero() {
  const last = HERO_HEADLINE_LINES.length - 1;

  return (
    <section
      aria-labelledby="hero-naslov"
      className="relative isolate overflow-clip"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-grid mask-radial opacity-50"
      />
      <div
        aria-hidden="true"
        className="absolute top-[58%] left-1/2 -z-10 h-[44rem] w-[min(70rem,140vw)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(56_200_255/0.14),transparent)]"
      />

      <div className="mx-auto max-w-7xl px-4 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <ul
          className="intro flex flex-wrap justify-center gap-2"
          style={delay(0)}
          aria-label="Stanje razvoja"
        >
          <li>
            <Badge tone="signal">Izdelki v razvoju</Badge>
          </li>
          <li>
            <Badge tone="accent">Vizualizacija prostora prihaja</Badge>
          </li>
        </ul>

        <h1
          id="hero-naslov"
          className="mt-8 font-display text-[clamp(2.6rem,7.6vw,6.25rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-fg"
        >
          {HERO_HEADLINE_LINES.map((line, index) => (
            <span
              key={line}
              className="intro block pb-[0.06em]"
              style={delay(120 + index * 130)}
            >
              {index === last ? (
                <span className="text-gradient">{line}</span>
              ) : (
                line
              )}
              {index < last ? " " : null}
            </span>
          ))}
        </h1>

        <p
          className="intro mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl"
          style={delay(560)}
        >
          {HERO_LEAD}
        </p>

        <div
          className="intro mt-10 flex flex-col justify-center gap-3 sm:flex-row"
          style={delay(680)}
        >
          <Link href="#izdelki" className={buttonClasses("primary", "lg")}>
            Razišči izdelke
          </Link>
          <Link
            href="#vizualizacija"
            className={buttonClasses("secondary", "lg")}
          >
            Oglej si vizijo platforme
          </Link>
        </div>
      </div>

      <figure
        className="intro relative mx-auto mt-12 max-w-5xl px-4 pb-20 sm:px-6 lg:mt-14 lg:pb-28"
        style={delay(820)}
      >
        <div
          aria-hidden="true"
          className="reveal-glow absolute inset-x-[15%] top-[30%] -z-10 h-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="reveal-zoom">
          <HeroComposition />
        </div>
        <figcaption className="mt-4 text-center text-xs text-fg-subtle">
          Konceptna grafika
        </figcaption>
      </figure>
    </section>
  );
}

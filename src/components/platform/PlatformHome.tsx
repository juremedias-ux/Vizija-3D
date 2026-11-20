import Link from "next/link";
import type { CSSProperties } from "react";

import { HeroComposition } from "@/components/graphics/HeroComposition";
import { Badge } from "@/components/ui/Badge";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { buttonClasses } from "@/components/ui/styles";
import {
  ENTRY_POINTS,
  PLATFORM_HEADLINE,
  PLATFORM_STEPS,
  PLATFORM_SUBHEADLINE,
  USE_CASES,
} from "@/content/platform";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const stagger = (index: number) => ({ "--s": index }) as CSSProperties;

function Icon({ d, className = "size-6" }: { d: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function PlatformHome() {
  return (
    <>
      <section
        aria-labelledby="domov-naslov"
        className="relative isolate overflow-clip"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-grid mask-radial opacity-50"
        />
        <div className="mx-auto max-w-7xl px-4 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="intro flex justify-center" style={delay(0)}>
            <Badge tone="accent">Prva različica · brezplačno</Badge>
          </div>
          <h1
            id="domov-naslov"
            className="intro mx-auto mt-7 max-w-5xl font-display text-[clamp(2.4rem,6.4vw,5.5rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance text-fg"
            style={delay(120)}
          >
            {PLATFORM_HEADLINE}
          </h1>
          <p
            className="intro mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted sm:text-xl"
            style={delay(260)}
          >
            {PLATFORM_SUBHEADLINE}
          </p>
          <div
            className="intro mt-9 flex flex-col justify-center gap-3 sm:flex-row"
            style={delay(380)}
          >
            <Link href="/studio" className={buttonClasses("primary", "lg")}>
              Začni brezplačno
            </Link>
            <Link
              href="#kako-deluje"
              className={buttonClasses("secondary", "lg")}
            >
              Kako deluje
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Začni ustvarjati</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {ENTRY_POINTS.map((entry, index) => (
              <li key={entry.nacin} className="reveal" style={stagger(index)}>
                <Link
                  href={`/studio?nacin=${entry.nacin}`}
                  className="group flex h-full flex-col rounded-[1.75rem] bg-surface-1 p-7 ring-1 ring-white/[0.07] transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgb(56_200_255/0.4)]"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-accent/12 text-accent">
                    <Icon d={entry.icon} />
                  </span>
                  <span className="mt-6 font-display text-2xl font-semibold tracking-tight text-fg">
                    {entry.title}
                  </span>
                  <span className="mt-2 leading-relaxed text-fg-muted">
                    {entry.text}
                  </span>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    Začni
                    <span
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative mx-auto mt-16 max-w-4xl px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="reveal-zoom">
            <HeroComposition />
          </div>
          <figcaption className="mt-3 text-center text-xs text-fg-subtle">
            Ponazoritev: model nastaja sloj za slojem
          </figcaption>
        </figure>
      </section>

      <section
        id="kako-deluje"
        aria-labelledby="kako-deluje-naslov"
        className="border-t border-white/[0.06]"
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <SectionIntro
            eyebrow="Kako deluje"
            title="Od ideje do datoteke v štirih korakih"
            titleId="kako-deluje-naslov"
            align="center"
          >
            <p>
              Brez Blenderja, CAD programov in tehničnih nastavitev. Pri vsakem
              koraku ti povemo, kaj je pomembno.
            </p>
          </SectionIntro>
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_STEPS.map((stepItem, index) => (
              <li
                key={stepItem.title}
                className="reveal rounded-[1.75rem] bg-surface-1 p-7 ring-1 ring-white/[0.06]"
                style={stagger(index)}
              >
                <span
                  aria-hidden="true"
                  className="text-gradient font-display text-5xl font-semibold"
                >
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-fg">
                  <span className="sr-only">{`Korak ${index + 1}: `}</span>
                  {stepItem.title}
                </h3>
                <p className="mt-2 leading-relaxed text-fg-muted">
                  {stepItem.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="primeri-naslov"
        className="border-t border-white/[0.06]"
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <SectionIntro
            eyebrow="Primeri uporabe"
            title="Kaj lahko ustvariš"
            titleId="primeri-naslov"
          >
            <p>
              Platforma je namenjena manjšim predmetom za dom, darila in hobije.
            </p>
          </SectionIntro>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((item, index) => (
              <li
                key={item.title}
                className="reveal flex gap-4 rounded-[1.5rem] bg-surface-1 p-6 ring-1 ring-white/[0.06]"
                style={stagger(index % 3)}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-accent">
                  <Icon d={item.icon} className="size-5" />
                </span>
                <span>
                  <h3 className="font-display text-lg font-semibold text-fg">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    {item.text}
                  </p>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="zacni-naslov"
        className="border-t border-white/[0.06] bg-surface-1"
      >
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <h2
            id="zacni-naslov"
            className="reveal font-display text-[clamp(2rem,5vw,3.75rem)] leading-tight font-semibold tracking-tight text-fg"
          >
            Tvoja ideja je lahko{" "}
            <span className="text-gradient">natisnjena že danes.</span>
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
            Brez registracije. Modeli se shranijo samo v tvojem brskalniku.
          </p>
          <div className="reveal mt-9">
            <Link href="/studio" className={buttonClasses("primary", "lg")}>
              Začni brezplačno
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

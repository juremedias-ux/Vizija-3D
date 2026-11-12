import type { CSSProperties } from "react";

import { SectionIntro } from "@/components/ui/SectionIntro";
import { MAX_PRODUCT_SLOTS } from "@/content/products";
import { QUANTITY_MAX, QUANTITY_MIN } from "@/lib/interest/validation";

const steps = [
  {
    title: "Izberi izdelek.",
    text: "Oglej si izdelke v razvoju in poišči tistega, ki bi ga uporabil doma ali pri delu.",
  },
  {
    title: "Določi količino in vpiši e-pošto.",
    text: `Na kartici izdelka izberi količino od ${QUANTITY_MIN} do ${QUANTITY_MAX} in vpiši e-poštni naslov za obvestilo.`,
  },
  {
    title: "Oddaj zanimanje in počakaj na obvestilo.",
    text: "Ko bo izdelek na voljo, te obvestimo. Do takrat ti ni treba storiti ničesar.",
  },
];

const stats = [
  {
    value: `${QUANTITY_MIN}–${QUANTITY_MAX}`,
    label: "kosov na posamezno prijavo",
  },
  { value: "0 €", label: "plačila ob oddaji zanimanja" },
  { value: String(MAX_PRODUCT_SLOTS), label: "mest v katalogu izdelkov" },
];

const stagger = (index: number) => ({ "--s": index }) as CSSProperties;

export function HowItWorks() {
  return (
    <section
      id="kako-deluje"
      aria-labelledby="kako-deluje-naslov"
      className="border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <SectionIntro
          eyebrow="Kako deluje danes"
          title="Do svojih favoritov v treh korakih"
          titleId="kako-deluje-naslov"
          align="center"
        >
          <p className="inline-flex items-center gap-2.5 font-medium text-success">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 10.5l4 4 8-9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Brez plačila in brez obveznosti nakupa.
          </p>
        </SectionIntro>

        <ol className="mt-16 grid gap-4 md:grid-cols-3 lg:mt-20">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="reveal relative overflow-hidden rounded-[1.75rem] bg-surface-1 p-8 ring-1 ring-white/[0.06] lg:p-10"
              style={stagger(index)}
            >
              <span
                aria-hidden="true"
                className="text-gradient font-display text-6xl font-semibold tracking-tight"
              >
                {index + 1}
              </span>
              <h3 className="mt-8 font-display text-2xl leading-snug font-semibold tracking-tight text-fg">
                <span className="sr-only">{`Korak ${index + 1}: `}</span>
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-fg-muted">{step.text}</p>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1.5 bg-layers opacity-70"
              />
            </li>
          ))}
        </ol>

        <dl className="mt-20 grid gap-12 text-center sm:grid-cols-3 lg:mt-28">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="reveal flex flex-col"
              style={stagger(index)}
            >
              <dt className="order-2 mt-2 text-base text-fg-muted">
                {stat.label}
              </dt>
              <dd className="text-gradient order-1 font-display text-[clamp(3rem,7vw,5rem)] leading-none font-semibold tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

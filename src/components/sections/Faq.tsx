import type { CSSProperties } from "react";

import { SectionIntro } from "@/components/ui/SectionIntro";
import { faqItems } from "@/content/faq";

export function Faq() {
  return (
    <section
      id="vprasanja"
      aria-labelledby="vprasanja-naslov"
      className="border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <SectionIntro
          eyebrow="Vprašanja in odgovori"
          title="Pogosta vprašanja"
          titleId="vprasanja-naslov"
          align="center"
        >
          <p>Kratki odgovori o tem, kaj spletno mesto trenutno omogoča.</p>
        </SectionIntro>

        <ul className="mx-auto mt-14 max-w-3xl border-t border-white/10">
          {faqItems.map((item, index) => (
            <li
              key={item.question}
              className="reveal border-b border-white/10"
              style={{ "--s": Math.min(index, 3) } as CSSProperties}
            >
              <details className="group">
                <summary className="flex min-h-20 cursor-pointer items-center justify-between gap-6 py-5 font-display text-xl font-semibold tracking-tight text-fg transition-colors hover:text-accent sm:text-2xl">
                  <h3 className="text-left">{item.question}</h3>
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-fg-muted transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-accent/15 group-open:text-accent"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M5 10h10M10 5v10" />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 text-lg leading-relaxed text-fg-muted">
                  {item.answer}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

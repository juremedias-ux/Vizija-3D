import { SectionIntro } from "@/components/ui/SectionIntro";
import { faqItems } from "@/content/faq";

export function Faq() {
  return (
    <section id="vprasanja" aria-labelledby="vprasanja-naslov">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionIntro
              index="04"
              label="Vprašanja in odgovori"
              title="Pogosta vprašanja"
              titleId="vprasanja-naslov"
            >
              <p>Kratki odgovori o tem, kaj spletno mesto trenutno omogoča.</p>
            </SectionIntro>
          </div>

          <div className="lg:col-span-8">
            <ul className="divide-y divide-line border-y border-line">
              {faqItems.map((item) => (
                <li key={item.question}>
                  <details className="group">
                    <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 py-4 font-display text-lg font-medium text-fg transition-colors hover:text-accent">
                      <h3 className="text-left">{item.question}</h3>
                      <span
                        aria-hidden="true"
                        className="relative grid size-8 shrink-0 place-items-center rounded-md border border-line-strong text-fg-muted transition-colors group-open:border-accent group-open:text-accent"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="size-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        >
                          <path d="M5 10h10" />
                          <path d="M10 5v10" className="group-open:hidden" />
                        </svg>
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-6 text-base leading-relaxed text-fg-muted">
                      {item.answer}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

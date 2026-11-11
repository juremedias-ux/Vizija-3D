import { Badge } from "@/components/ui/Badge";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { HERO_HEADLINE } from "@/content/copy";
import {
  CONCEPT_PREVIEW_LABEL,
  RoomConceptPreview,
} from "@/features/room-visualization/RoomConceptPreview";

const futureSteps = [
  {
    title: "Fotografiraj prostor",
    text: "Naložil boš fotografijo prostora, v katerega želiš postaviti izdelek.",
  },
  {
    title: "Umesti izdelke",
    text: "Izdelke boš postavil na želeno mesto in preveril, kako se ujemajo s prostorom.",
  },
  {
    title: "Naroči izdelavo",
    text: "Izbrane izdelke boš lahko naročil v izdelavo.",
  },
];

/**
 * Predstavitev prihodnje funkcije. Ne vsebuje nalaganja, analize ali
 * shranjevanja fotografij — vse je označeno kot funkcija v pripravi.
 */
export function RoomVision() {
  return (
    <section
      id="vizualizacija"
      aria-labelledby="vizualizacija-naslov"
      className="relative isolate overflow-hidden border-b border-line bg-surface-1"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-grid opacity-50 mask-fade-b"
      />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          index="03"
          label="Vizija platforme"
          title="Tvoj prostor. Naši izdelki. Tvoja vizija."
          titleId="vizualizacija-naslov"
        >
          <div className="mb-5">
            <Badge tone="accent">Funkcija v pripravi</Badge>
          </div>
          <p>
            V prihodnje boš lahko naložil fotografijo svojega prostora, preveril
            postavitev naših izdelkov in naročil njihovo izdelavo.
          </p>
          <p className="mt-5 border-l-2 border-accent pl-4 font-display text-xl font-medium tracking-tight text-fg">
            {HERO_HEADLINE}
          </p>
        </SectionIntro>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
          <figure className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-xl border border-line-strong">
              <RoomConceptPreview />
              <p className="absolute top-3 left-1/2 -translate-x-1/2 rounded-md border border-accent/50 bg-bg/90 px-2.5 py-1 font-mono text-[11px] tracking-[0.16em] text-accent uppercase sm:top-4">
                Koncept
              </p>
            </div>
            <figcaption className="mt-3 flex items-start gap-2.5 rounded-md border border-line bg-bg px-4 py-3 text-sm text-fg">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="mt-0.5 size-4 shrink-0 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 9v5M10 6v.5" strokeLinecap="round" />
              </svg>
              {CONCEPT_PREVIEW_LABEL}
            </figcaption>
          </figure>

          <div className="lg:col-span-4">
            <h3 className="font-mono text-xs tracking-[0.18em] text-fg-subtle uppercase">
              Kako bo delovalo
            </h3>
            <ol className="mt-4 grid gap-3">
              {futureSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-line bg-bg/60 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className="font-mono text-sm text-accent"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-fg-subtle uppercase">
                      V pripravi
                    </span>
                  </div>
                  <h4 className="mt-3 font-display text-lg font-semibold text-fg">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Fotografij prostora zaenkrat ne sprejemamo in ne shranjujemo. Do
              takrat lahko oddaš{" "}
              <a
                href="#izdelki"
                className="text-accent underline underline-offset-4 hover:text-accent-hover"
              >
                zanimanje za izdelke
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

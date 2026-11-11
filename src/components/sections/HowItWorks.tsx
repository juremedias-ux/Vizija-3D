import { SectionIntro } from "@/components/ui/SectionIntro";

const steps = [
  {
    title: "Izberi izdelek.",
    text: "Oglej si izdelke v razvoju in poišči tistega, ki bi ga uporabil doma ali pri delu.",
  },
  {
    title: "Določi količino in vpiši e-pošto.",
    text: "Na kartici izdelka izberi količino od 1 do 99 in vpiši e-poštni naslov za obvestilo.",
  },
  {
    title: "Oddaj zanimanje in počakaj na obvestilo.",
    text: "Ko bo izdelek na voljo, te obvestimo. Do takrat ti ni treba storiti ničesar.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="kako-deluje"
      aria-labelledby="kako-deluje-naslov"
      className="border-b border-line"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          index="01"
          label="Kako deluje danes"
          title="Do svojih favoritov v treh korakih"
          titleId="kako-deluje-naslov"
          aside={
            <p className="inline-flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-4 shrink-0"
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
          }
        />

        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative bg-surface-1 p-6 sm:p-8">
              <span
                aria-hidden="true"
                className="font-mono text-sm text-accent"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-fg">
                <span className="sr-only">{`Korak ${index + 1}: `}</span>
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                {step.text}
              </p>
              <span
                aria-hidden="true"
                className="absolute inset-x-6 bottom-0 h-1 bg-layers opacity-60 sm:inset-x-8"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

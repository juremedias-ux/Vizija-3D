import type { Metadata } from "next";
import Link from "next/link";

import { ProjectListLoader } from "@/components/studio/ProjectListLoader";
import { buttonClasses } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Moji modeli",
  description:
    "Seznam 3D modelov, ki si jih ustvaril ali uredil v Studiu. Shranjeni so v tvojem brskalniku.",
};

export default function MyModelsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-accent">Moji modeli</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
            Tvoji projekti
          </h1>
          <p className="mt-3 max-w-2xl text-fg-muted">
            Modeli so shranjeni samo v tem brskalniku. Če izbrišeš podatke
            brskalnika ali odpreš stran na drugi napravi, jih tam ne bo.
          </p>
        </div>
        <Link href="/studio" className={buttonClasses("primary", "lg")}>
          Nov model
        </Link>
      </div>
      <div className="mt-10">
        <ProjectListLoader />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { StudioLoader } from "@/components/studio/StudioLoader";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Ustvari 3D model iz opisa ali slike, uredi obstoječi model, preveri ga za tisk in prenesi datoteko STL, GLB ali paket ZIP.",
};

export default function StudioPage() {
  return (
    <div className="pt-8 sm:pt-10">
      <div className="mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-accent">Studio</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Ustvari in pripravi model za 3D tisk
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-fg-muted">
          Opiši predmet, naloži sliko ali svoj model. Predogledaj ga, uredi in
          prenesi datoteko za tisk.
        </p>
      </div>
      <Suspense fallback={null}>
        <StudioLoader />
      </Suspense>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

/** Studio (in Three.js) se naloži šele v brskalniku. */
const StudioApp = dynamic(() => import("./StudioApp"), {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4"
      role="status"
    >
      <p className="flex items-center gap-3 text-fg-muted">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent motion-reduce:animate-none"
        />
        Nalagam Studio …
      </p>
    </div>
  ),
});

export function StudioLoader() {
  return <StudioApp />;
}

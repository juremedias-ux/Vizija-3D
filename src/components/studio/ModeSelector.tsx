"use client";

import type { CreationMode } from "@/lib/model3d/types";

export const MODES: {
  value: CreationMode;
  title: string;
  text: string;
  icon: string;
}[] = [
  {
    value: "besedilo",
    title: "Ustvari iz besedila",
    text: "Opiši predmet z nekaj besedami, mi pripravimo model.",
    icon: "M4 6h12M4 10h12M4 14h7",
  },
  {
    value: "slika",
    title: "Ustvari iz slike",
    text: "Naloži fotografijo, skico ali več referenčnih slik.",
    icon: "M3 5h14v10H3zM6 12l3-3 3 3 2-2 3 3M7 8.5h.01",
  },
  {
    value: "model",
    title: "Uredi obstoječi 3D model",
    text: "Naloži svojo datoteko STL, OBJ ali GLB in jo pripravi za tisk.",
    icon: "M10 3l6 3.5v7L10 17l-6-3.5v-7zM10 10l6-3.5M10 10v7M10 10L4 6.5",
  },
];

export function ModeSelector({
  value,
  onSelect,
}: {
  value: CreationMode | null;
  onSelect: (mode: CreationMode) => void;
}) {
  return (
    <div
      className="grid gap-3"
      role="radiogroup"
      aria-label="Način ustvarjanja"
    >
      {MODES.map((mode) => {
        const selected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(mode.value)}
            className={`flex items-start gap-4 rounded-2xl p-4 text-left ring-1 transition-colors ${
              selected
                ? "bg-accent/10 ring-accent"
                : "bg-surface-2 ring-white/10 hover:ring-white/25"
            }`}
          >
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ${selected ? "bg-accent text-accent-ink" : "bg-white/[0.06] text-accent"}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={mode.icon} />
              </svg>
            </span>
            <span>
              <span className="block font-display text-lg font-semibold tracking-tight text-fg">
                {mode.title}
              </span>
              <span className="mt-0.5 block text-sm leading-relaxed text-fg-muted">
                {mode.text}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

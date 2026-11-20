"use client";

import { useId, useState } from "react";

import {
  PROMPT_EXAMPLES,
  type PromptSuggestion,
  suggestPromptImprovements,
} from "@/lib/model3d/prompt";
import type { ModelSettings } from "@/lib/model3d/types";

import { Notice, smallButton } from "./ui";

export function PromptInput({
  value,
  onChange,
  settings,
  required = true,
  label = "Opiši predmet",
}: {
  value: string;
  onChange: (value: string) => void;
  settings: ModelSettings;
  required?: boolean;
  label?: string;
}) {
  const id = useId();
  const [suggestions, setSuggestions] = useState<{
    items: PromptSuggestion[];
    improved: string;
  } | null>(null);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required ? null : <span className="text-fg-subtle"> (neobvezno)</span>}
      </label>
      <p
        id={`${id}-namig`}
        className="mt-1 text-xs leading-relaxed text-fg-subtle"
      >
        Napiši, kaj želiš, približne mere in namen. Na primer: »posoda za
        ključe, 12 x 8 x 3 cm«.
      </p>
      <textarea
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setSuggestions(null);
        }}
        rows={5}
        maxLength={600}
        aria-describedby={`${id}-namig`}
        placeholder="Minimalistična posoda za ključe, 12 x 8 x 3 cm, za 3D tisk"
        className="mt-2 block w-full resize-y rounded-2xl border border-white/10 bg-surface-2 px-4 py-3 text-base leading-relaxed text-fg placeholder:text-fg-subtle hover:border-white/20 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-fg-subtle">{value.length} / 600</span>
        <button
          type="button"
          className={smallButton}
          disabled={value.trim().length < 3}
          onClick={() => {
            const result = suggestPromptImprovements(value, settings);
            setSuggestions({
              items: result.suggestions,
              improved: result.improved,
            });
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          >
            <path d="M10 3v3M10 14v3M3 10h3M14 10h3M5 5l2 2M13 13l2 2M15 5l-2 2M7 13l-2 2" />
          </svg>
          Izboljšaj opis
        </button>
      </div>

      {suggestions ? (
        <div className="mt-3" aria-live="polite">
          {suggestions.items.length ? (
            <Notice title="Predlogi za boljši opis">
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {suggestions.items.map((item) => (
                  <li key={item.addition}>
                    {item.reason} Dodaj: »{item.addition}«.
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${smallButton} mt-3`}
                onClick={() => {
                  onChange(suggestions.improved);
                  setSuggestions(null);
                }}
              >
                Uporabi izboljšan opis
              </button>
            </Notice>
          ) : (
            <Notice tone="success">Opis je že dovolj natančen.</Notice>
          )}
        </div>
      ) : null}

      <details className="group mt-4">
        <summary className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-accent">
          Primeri dobrih opisov
        </summary>
        <ul className="mt-2 grid gap-2">
          {PROMPT_EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => onChange(example)}
                className="w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-left text-sm text-fg-muted ring-1 ring-white/10 transition-colors hover:text-fg hover:ring-white/25"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

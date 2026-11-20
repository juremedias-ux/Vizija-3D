"use client";

import { useId } from "react";

import type {
  ModelSettings,
  Purpose,
  SizeUnit,
  Strength,
  Surface,
  WallChoice,
} from "@/lib/model3d/types";

import { Segmented, fieldInput } from "./ui";

export const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: "dekoracija", label: "Dekoracija" },
  { value: "funkcionalen", label: "Uporaben predmet" },
  { value: "figura", label: "Figura" },
  { value: "organizator", label: "Organizator" },
  { value: "darilo", label: "Darilo" },
  { value: "popravilo", label: "Popravilo" },
];

const COLORS = [
  { value: "#38c8ff", label: "Modra" },
  { value: "#f4f4f2", label: "Bela" },
  { value: "#2b2f35", label: "Črna" },
  { value: "#f26b3a", label: "Oranžna" },
  { value: "#5fe0a8", label: "Zelena" },
  { value: "#f4b63f", label: "Rumena" },
];

/** Nastavitve za hobi uporabnika (korak 3). */
export function SettingsPanel({
  settings,
  onChange,
  sizeValue,
  onSizeChange,
  sizeHelp,
}: {
  settings: ModelSettings;
  onChange: (patch: Partial<ModelSettings>) => void;
  /** Največja mera v izbrani enoti ali "" (samodejno). */
  sizeValue: string;
  onSizeChange: (value: string) => void;
  sizeHelp: string;
}) {
  const sizeId = useId();
  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor={sizeId} className="block text-sm font-medium text-fg">
          Velikost predmeta (največja mera)
        </label>
        <p
          id={`${sizeId}-namig`}
          className="mt-1 text-xs leading-relaxed text-fg-subtle"
        >
          {sizeHelp}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            id={sizeId}
            type="text"
            inputMode="decimal"
            value={sizeValue}
            onChange={(event) => onSizeChange(event.target.value)}
            placeholder="samodejno"
            aria-describedby={`${sizeId}-namig`}
            className={`${fieldInput} max-w-36`}
          />
          <Segmented<SizeUnit>
            legend="Enota"
            value={settings.unit}
            options={[
              { value: "mm", label: "mm" },
              { value: "cm", label: "cm" },
            ]}
            onChange={(unit) => onChange({ unit })}
          />
        </div>
      </div>

      <Segmented<Purpose>
        legend="Namen"
        value={settings.purpose}
        options={PURPOSE_OPTIONS}
        onChange={(purpose) => onChange({ purpose })}
      />

      <Segmented<Surface>
        legend="Površina"
        help="Vpliva samo na videz v predogledu."
        value={settings.surface}
        options={[
          { value: "mat", label: "Mat" },
          { value: "sijajna", label: "Sijajna" },
          { value: "groba", label: "Groba" },
          { value: "gladka", label: "Gladka" },
        ]}
        onChange={(surface) => onChange({ surface })}
      />

      <fieldset>
        <legend className="text-sm font-medium text-fg">Barva</legend>
        <p className="mt-1 text-xs text-fg-subtle">
          Samo predlog za predogled; barvo določi filament.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <label
              key={color.value}
              className="relative grid size-11 cursor-pointer place-items-center rounded-full ring-1 ring-white/15 has-[:checked]:ring-2 has-[:checked]:ring-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
              title={color.label}
            >
              <input
                type="radio"
                name="barva"
                value={color.value}
                checked={settings.color === color.value}
                onChange={() => onChange({ color: color.value })}
                className="sr-only"
              />
              <span
                className="size-7 rounded-full"
                style={{ background: color.value }}
                aria-hidden="true"
              />
              <span className="sr-only">{color.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Segmented<Strength>
        legend="Trdnost"
        help="Določi priporočeno polnitev pri tisku (10 %, 20 % ali 40 %)."
        value={settings.strength}
        options={[
          { value: "lahka", label: "Lahka" },
          { value: "obicajna", label: "Običajna" },
          { value: "mocna", label: "Močna" },
        ]}
        onChange={(strength) => onChange({ strength })}
      />

      <Segmented<WallChoice>
        legend="Debelina sten"
        help="Tanko 1,2 mm · običajno 2 mm · debelo 3,2 mm. Debelejše stene so trdnejše."
        value={settings.wall}
        options={[
          { value: "tanko", label: "Tanko" },
          { value: "obicajno", label: "Običajno" },
          { value: "debelo", label: "Debelo" },
        ]}
        onChange={(wall) => onChange({ wall })}
      />

      <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">Podpore za tisk:</span>{" "}
        priporočilo pripravimo samodejno, ko preverimo model.
      </p>
    </div>
  );
}

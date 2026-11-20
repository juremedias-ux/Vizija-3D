"use client";

import { useId, useState } from "react";

import { sanitizeEngraving } from "@/lib/model3d/pixelFont";
import {
  type ModelSource,
  type SizeUnit,
  WALL_MM,
  type WallChoice,
} from "@/lib/model3d/types";

import { Notice, Segmented, fieldInput, smallButton } from "./ui";

const HOLE_KINDS = new Set(["obesek", "posoda", "vaza", "skatla"]);
const WALL_KINDS = new Set(["posoda", "vaza", "skatla", "stojalo"]);
const TEXT_KINDS = new Set(["obesek", "skatla"]);

const toUnit = (mm: number, unit: SizeUnit) => (unit === "cm" ? mm / 10 : mm);
const fromUnit = (value: number, unit: SizeUnit) =>
  unit === "cm" ? value * 10 : value;
const fmt = (value: number) =>
  new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 }).format(value);

function parseNumber(value: string): number | null {
  const n = Number(value.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function DimensionField({
  label,
  valueMm,
  unit,
  onCommit,
}: {
  label: string;
  valueMm: number;
  unit: SizeUnit;
  onCommit: (mm: number) => void;
}) {
  const id = useId();
  const [text, setText] = useState(fmt(toUnit(valueMm, unit)));
  const [error, setError] = useState(false);

  const commit = () => {
    const n = parseNumber(text);
    if (n === null) {
      setError(true);
      return;
    }
    const mm = fromUnit(n, unit);
    if (mm < 1 || mm > 1000) {
      setError(true);
      return;
    }
    setError(false);
    if (Math.abs(mm - valueMm) > 0.01) onCommit(mm);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
        {label} ({unit})
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
        aria-invalid={error || undefined}
        className={`${fieldInput} mt-1 aria-[invalid=true]:border-danger`}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger">
          Vpiši število med {unit === "cm" ? "0,1 in 100" : "1 in 1000"}.
        </p>
      ) : null}
    </div>
  );
}

function EngravingField({
  initial,
  onApply,
}: {
  initial: string;
  onApply: (value: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        aria-label="Besedilo napisa"
        value={text}
        maxLength={16}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onApply(sanitizeEngraving(text));
        }}
        className={fieldInput}
      />
      <button
        type="button"
        className={smallButton}
        onClick={() => onApply(sanitizeEngraving(text))}
      >
        Uporabi
      </button>
    </div>
  );
}

export function EditorControls({
  source,
  unit,
  onChange,
}: {
  source: ModelSource;
  unit: SizeUnit;
  onChange: (next: ModelSource, label: string) => void;
}) {
  const [lock, setLock] = useState(true);

  const dims = {
    w: source.spec.widthMm,
    d: source.spec.depthMm,
    h: source.spec.heightMm,
  };

  function setDims(axis: "w" | "d" | "h", mm: number) {
    const f = mm / dims[axis];
    const next = lock
      ? { w: dims.w * f, d: dims.d * f, h: dims.h * f }
      : { ...dims, [axis]: mm };
    const spec = {
      ...source.spec,
      widthMm: next.w,
      depthMm: next.d,
      heightMm: next.h,
    };
    onChange({ ...source, spec } as ModelSource, "Spremenjene mere");
  }

  function scale(f: number) {
    const spec = {
      ...source.spec,
      widthMm: dims.w * f,
      depthMm: dims.d * f,
      heightMm: dims.h * f,
    };
    onChange(
      { ...source, spec } as ModelSource,
      f > 1 ? "Povečan model" : "Pomanjšan model",
    );
  }

  function rotate(axis: "x" | "y" | "z") {
    const rotation = {
      ...source.rotation,
      [axis]: (source.rotation[axis] + 90) % 360,
    };
    onChange(
      { ...source, rotation },
      `Zavrteno okoli osi ${axis.toUpperCase()}`,
    );
  }

  const parametric = source.type === "parametric" ? source : null;
  const kind = parametric?.spec.kind;
  const meshReason =
    "Pri naloženih modelih in modelih umetne inteligence tega v tej različici ni mogoče urejati. Uporabi program za 3D modeliranje.";
  const wallChoice = (Object.entries(WALL_MM).find(
    ([, mm]) => parametric && Math.abs(mm - parametric.spec.wallMm) < 0.05,
  )?.[0] ?? "obicajno") as WallChoice;

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="text-sm font-medium text-fg">Velikost</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <DimensionField
            key={`w-${dims.w}-${unit}`}
            label="Širina"
            valueMm={dims.w}
            unit={unit}
            onCommit={(mm) => setDims("w", mm)}
          />
          <DimensionField
            key={`d-${dims.d}-${unit}`}
            label="Globina"
            valueMm={dims.d}
            unit={unit}
            onCommit={(mm) => setDims("d", mm)}
          />
          <DimensionField
            key={`h-${dims.h}-${unit}`}
            label="Višina"
            valueMm={dims.h}
            unit={unit}
            onCommit={(mm) => setDims("h", mm)}
          />
        </div>
        <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={lock}
            onChange={(event) => setLock(event.target.checked)}
            className="size-5 accent-accent"
          />
          Ohrani razmerje
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={smallButton}
            onClick={() => scale(0.9)}
          >
            Pomanjšaj za 10 %
          </button>
          <button
            type="button"
            className={smallButton}
            onClick={() => scale(1.1)}
          >
            Povečaj za 10 %
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-fg">Vrtenje</legend>
        <p className="mt-1 text-xs text-fg-subtle">
          Model se po vrtenju samodejno postavi na ploščo.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={smallButton}
            onClick={() => rotate("x")}
          >
            Prevrni naprej (X)
          </button>
          <button
            type="button"
            className={smallButton}
            onClick={() => rotate("y")}
          >
            Zavrti (Y)
          </button>
          <button
            type="button"
            className={smallButton}
            onClick={() => rotate("z")}
          >
            Prevrni vstran (Z)
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={
              !source.rotation.x && !source.rotation.y && !source.rotation.z
            }
            onClick={() =>
              onChange(
                { ...source, rotation: { x: 0, y: 0, z: 0 } },
                "Ponastavljeno vrtenje",
              )
            }
          >
            Ponastavi
          </button>
        </div>
      </fieldset>

      <fieldset disabled={!parametric || !HOLE_KINDS.has(kind ?? "")}>
        <legend className="text-sm font-medium text-fg">Luknja</legend>
        {parametric && HOLE_KINDS.has(kind ?? "") ? (
          <label className="mt-2 flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={parametric.spec.hole}
              onChange={(event) =>
                onChange(
                  {
                    ...parametric,
                    spec: { ...parametric.spec, hole: event.target.checked },
                  },
                  event.target.checked ? "Dodana luknja" : "Odstranjena luknja",
                )
              }
              className="size-5 accent-accent"
            />
            {kind === "obesek"
              ? "Luknja za obešanje"
              : "Luknja v dnu (npr. za odtok)"}
          </label>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
            {parametric ? "Za to obliko luknje ni mogoče dodati." : meshReason}
          </p>
        )}
      </fieldset>

      {parametric && WALL_KINDS.has(kind ?? "") ? (
        <Segmented<WallChoice>
          legend="Debelina stene"
          value={wallChoice}
          options={[
            { value: "tanko", label: "Tanko" },
            { value: "obicajno", label: "Običajno" },
            { value: "debelo", label: "Debelo" },
          ]}
          onChange={(wall) =>
            onChange(
              {
                ...parametric,
                spec: { ...parametric.spec, wallMm: WALL_MM[wall] },
              },
              "Spremenjena debelina stene",
            )
          }
        />
      ) : (
        <div>
          <p className="text-sm font-medium text-fg">Debelina stene</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
            {parametric ? "Ta oblika nima votlih sten." : meshReason}
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-fg">Napis</p>
        {parametric && TEXT_KINDS.has(kind ?? "") ? (
          <>
            <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
              Izbočen napis iz velikih tiskanih črk (do 16 znakov, tudi Č, Š,
              Ž).
            </p>
            <EngravingField
              key={parametric.spec.text}
              initial={parametric.spec.text}
              onApply={(value) =>
                onChange(
                  { ...parametric, spec: { ...parametric.spec, text: value } },
                  value ? "Dodan napis" : "Odstranjen napis",
                )
              }
            />
          </>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
            {parametric ? "Napis je mogoč na obesku in škatli." : meshReason}
          </p>
        )}
      </div>

      {source.type === "mesh" ? (
        <Notice>
          Naloženi model lahko povečaš, pomanjšaš in zavrtiš. Ostale spremembe
          naredi v programu za 3D modeliranje.
        </Notice>
      ) : null}
    </div>
  );
}

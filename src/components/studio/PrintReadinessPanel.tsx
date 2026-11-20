"use client";

import type { PrintAnalysis } from "@/lib/model3d/analysis";
import { suggestedMaterial } from "@/lib/model3d/export";
import {
  INFILL_PERCENT,
  type ModelSettings,
  type SizeUnit,
  WALL_MM,
} from "@/lib/model3d/types";

import { Notice, StatusPill, secondaryButton } from "./ui";

const num = (value: number, digits = 1) =>
  new Intl.NumberFormat("sl-SI", { maximumFractionDigits: digits }).format(
    value,
  );

function bytes(value: number): string {
  if (value > 1024 * 1024) return `${num(value / 1024 / 1024)} MB`;
  return `${num(value / 1024, 0)} kB`;
}

export function PrintReadinessPanel({
  analysis,
  analyzing,
  settings,
  unit,
  onRepair,
  repairing,
  repairMessage,
}: {
  analysis: PrintAnalysis | null;
  analyzing: boolean;
  settings: ModelSettings;
  unit: SizeUnit;
  onRepair: () => void;
  repairing: boolean;
  repairMessage: string | null;
}) {
  const conv = (mm: number) => num(unit === "cm" ? mm / 10 : mm);
  const functional =
    settings.purpose === "funkcionalen" ||
    settings.purpose === "popravilo" ||
    settings.purpose === "organizator";

  return (
    <div className="grid gap-5">
      <Notice tone="warning">
        Pred tiskom preveri dimenzije, debelino sten in geometrijo modela.
      </Notice>
      {functional ? (
        <Notice tone="warning">
          Za funkcionalne ali mehanske dele model morda ni dovolj natančen. Za
          natančne dele (npr. ki se morajo prilegati drugim) uporabi CAD
          program.
        </Notice>
      ) : null}

      {analyzing || !analysis ? (
        <p
          role="status"
          className="flex items-center gap-3 text-sm text-fg-muted"
        >
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent motion-reduce:animate-none"
          />
          Preverjam model …
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-surface-2 p-4 text-sm">
            <div className="col-span-2">
              <dt className="text-fg-subtle">Mere (š × g × v)</dt>
              <dd className="mt-0.5 font-display text-lg font-semibold text-fg">
                {conv(analysis.size.x)} × {conv(analysis.size.z)} ×{" "}
                {conv(analysis.size.y)} {unit}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Velikost datoteke STL</dt>
              <dd className="mt-0.5 text-fg">
                približno {bytes(analysis.stlBytes)}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Število ploskev</dt>
              <dd className="mt-0.5 text-fg">{num(analysis.triangles, 0)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Predlagan material</dt>
              <dd className="mt-0.5 text-fg">{suggestedMaterial(settings)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Priporočena stena</dt>
              <dd className="mt-0.5 text-fg">
                vsaj {num(WALL_MM[settings.wall])} mm
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Polnitev</dt>
              <dd className="mt-0.5 text-fg">
                {INFILL_PERCENT[settings.strength]} %
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Podpore</dt>
              <dd className="mt-0.5 text-fg">
                {analysis.supportsRecommended ? "priporočene" : "niso potrebne"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-medium text-fg">Preverjanje za tisk</h3>
            <ul className="mt-2 grid gap-2">
              {analysis.checks.map((check) => (
                <li
                  key={check.id}
                  className="rounded-xl bg-surface-2 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-fg">{check.title}</p>
                    <StatusPill status={check.status} />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    {check.message}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
              Preverjanje je osnovno: debelino sten ocenimo vzorčno, previse in
              dele pa poenostavljeno.
            </p>
          </div>

          {analysis.ready ? (
            <Notice tone="success" title="Model je pripravljen za tisk">
              Prenesi datoteko in jo odpri v programu za tisk (slicerju).
            </Notice>
          ) : (
            <div className="grid gap-3">
              <Notice tone="error" title="Model ni idealen za tisk">
                Poskusi samodejni popravek ali spremeni velikost in obliko.
              </Notice>
              <button
                type="button"
                className={secondaryButton}
                onClick={onRepair}
                disabled={repairing}
              >
                {repairing ? "Popravljam …" : "Poskusi popraviti model"}
              </button>
            </div>
          )}
          {repairMessage ? (
            <p role="status" className="text-sm text-fg-muted">
              {repairMessage}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

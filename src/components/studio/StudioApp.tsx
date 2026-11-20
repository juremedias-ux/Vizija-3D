"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type * as THREE from "three";

import type { ProviderInfo } from "@/lib/generation/types";
import { type PrintAnalysis, analyzeGeometry } from "@/lib/model3d/analysis";
import {
  buildSpecText,
  createZip,
  downloadBlob,
  slugify,
  toBinaryStl,
  toGlb,
} from "@/lib/model3d/export";
import {
  PROGRESS_STAGES,
  fetchProviderInfo,
  generateWithAi,
  nameFromPrompt,
  parametricSource,
  reliefFromImage,
  specFromPrompt,
} from "@/lib/model3d/generate";
import { buildModelGeometry } from "@/lib/model3d/geometry";
import {
  FriendlyError,
  IMAGE_TYPES,
  loadModelFile,
  validateImageFile,
} from "@/lib/model3d/loaders";
import { BLOCKED_MESSAGE, isBlockedContent } from "@/lib/model3d/prompt";
import { repairPositions } from "@/lib/model3d/repair";
import {
  type ProjectStatus,
  getProject,
  newProjectId,
  saveProject,
} from "@/lib/model3d/storage";
import {
  BUILD_VOLUME_MM,
  type CreationMode,
  DEFAULT_SETTINGS,
  type ModelSettings,
  type ModelSource,
  NO_ROTATION,
  WALL_MM,
} from "@/lib/model3d/types";

import { EditorControls } from "./EditorControls";
import { FileDrop } from "./FileDrop";
import { HistoryPanel } from "./HistoryPanel";
import { MODES, ModeSelector } from "./ModeSelector";
import type { ModelViewerHandle } from "./ModelViewer";
import { PrintReadinessPanel } from "./PrintReadinessPanel";
import { PromptInput } from "./PromptInput";
import { SettingsPanel } from "./SettingsPanel";
import {
  Notice,
  Panel,
  primaryButton,
  secondaryButton,
  smallButton,
} from "./ui";

const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[18rem] place-items-center rounded-[1.5rem] bg-[#0b0e11] text-sm text-fg-subtle ring-1 ring-white/10">
      Nalagam 3D predogled …
    </div>
  ),
});

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Način" },
  { n: 2, label: "Vnos" },
  { n: 3, label: "Nastavitve" },
  { n: 4, label: "Predogled in urejanje" },
  { n: 5, label: "Priprava za tisk" },
];

interface HistoryItem {
  id: number;
  label: string;
  time: string;
  source: ModelSource;
}

const MAX_HISTORY = 30;

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function timeLabel() {
  return new Date().toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseSize(text: string, unit: "mm" | "cm"): number | null {
  const n = Number(text.replace(",", ".").trim());
  if (!text.trim() || !Number.isFinite(n) || n <= 0) return null;
  const mm = unit === "cm" ? n * 10 : n;
  return Math.min(Math.max(mm, 5), 300);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function StudioApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewerRef = useRef<ModelViewerHandle>(null);

  const initialMode = (() => {
    const nacin = searchParams.get("nacin");
    if (searchParams.get("projekt")) return null;
    return nacin === "besedilo" || nacin === "slika" || nacin === "model"
      ? nacin
      : null;
  })();
  const [step, setStep] = useState<Step>(initialMode ? 2 : 1);
  const [mode, setMode] = useState<CreationMode | null>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [invertRelief, setInvertRelief] = useState(false);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const [sizeText, setSizeText] = useState("");
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const [source, setSource] = useState<ModelSource | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);
  const historyCounter = useRef(0);
  const [notes, setNotes] = useState<string[]>([]);
  const [modelKey, setModelKey] = useState("prazno");

  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [analysisState, setAnalysisState] = useState<{
    geometry: THREE.BufferGeometry;
    wall: string;
    result: PrintAnalysis;
  } | null>(null);
  const [repairing, setRepairing] = useState(false);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  const [project, setProject] = useState<{
    id: string;
    name: string;
    createdAt: string;
  } | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [exportBusy, setExportBusy] = useState<null | "stl" | "glb" | "zip">(
    null,
  );
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const geometry = useMemo(
    () => (source ? buildModelGeometry(source) : null),
    [source],
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const analysis =
    analysisState &&
    analysisState.geometry === geometry &&
    analysisState.wall === settings.wall
      ? analysisState.result
      : null;
  const analyzing = Boolean(geometry) && !analysis;

  const targetMm = parseSize(sizeText, settings.unit);
  const providerMode = provider?.mode ?? "demo";

  /* ------------------------------------------------------------- začetek */

  useEffect(() => {
    let cancelled = false;
    void fetchProviderInfo().then((info) => {
      if (!cancelled) setProvider(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadedProject = useRef<string | null>(null);
  useEffect(() => {
    const projectId = searchParams.get("projekt");
    if (projectId && loadedProject.current !== projectId) {
      loadedProject.current = projectId;
      void getProject(projectId)
        .then((stored) => {
          if (!stored) {
            setGenerationError(
              "Projekta ni bilo mogoče najti v tem brskalniku.",
            );
            return;
          }
          setMode(stored.mode);
          setPrompt(stored.prompt);
          setSettings(stored.settings);
          setProject({
            id: stored.id,
            name: stored.name,
            createdAt: stored.createdAt,
          });
          const restored = stored.source as ModelSource;
          setSource(restored);
          historyCounter.current += 1;
          const entry = {
            id: historyCounter.current,
            label: "Odprt shranjen projekt",
            time: timeLabel(),
            source: restored,
          };
          setHistory([entry]);
          setCurrentHistoryId(entry.id);
          setModelKey(`projekt-${stored.id}`);
          setStep(4);
        })
        .catch(() =>
          setGenerationError("Shranjenih projektov ni bilo mogoče prebrati."),
        );
    }
  }, [searchParams]);

  /* ------------------------------------------------------------- analiza */

  useEffect(() => {
    if (!geometry) return;
    const wall = settings.wall;
    const timer = setTimeout(() => {
      setAnalysisState({
        geometry,
        wall,
        result: analyzeGeometry(geometry, { recommendedWallMm: WALL_MM[wall] }),
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [geometry, settings.wall]);

  /* -------------------------------------------------------- shranjevanje */

  const analysisRef = useRef(analysis);
  useEffect(() => {
    analysisRef.current = analysis;
  }, [analysis]);

  const persist = useCallback(async () => {
    if (!source || !project) return;
    setSaveState("saving");
    const current = analysisRef.current;
    const status: ProjectStatus = !current
      ? "osnutek"
      : current.ready
        ? "pripravljen"
        : "potrebuje-popravek";
    try {
      await saveProject({
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
        status,
        mode: mode ?? "besedilo",
        prompt,
        settings,
        source,
        thumbnail: viewerRef.current?.capture() ?? null,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [source, project, mode, prompt, settings]);

  useEffect(() => {
    if (!source || !project) return;
    const timer = setTimeout(() => void persist(), 1200);
    return () => clearTimeout(timer);
  }, [source, project, settings, analysis, persist]);

  useEffect(() => {
    if (project && searchParams.get("projekt") !== project.id) {
      router.replace(`/studio?projekt=${project.id}`, { scroll: false });
    }
  }, [project, router, searchParams]);

  /* ------------------------------------------------------- spremembe */

  const applyChange = useCallback((next: ModelSource, label: string) => {
    historyCounter.current += 1;
    const entry = {
      id: historyCounter.current,
      label,
      time: timeLabel(),
      source: next,
    };
    setSource(next);
    setHistory((list) => [...list, entry].slice(-MAX_HISTORY));
    setCurrentHistoryId(entry.id);
    setRepairMessage(null);
  }, []);

  function startNewModel(
    next: ModelSource,
    label: string,
    name: string,
    extraNotes: string[],
  ) {
    historyCounter.current += 1;
    const entry = {
      id: historyCounter.current,
      label,
      time: timeLabel(),
      source: next,
    };
    setSource(next);
    setHistory([entry]);
    setCurrentHistoryId(entry.id);
    setNotes(extraNotes);
    setModelKey(`model-${entry.id}`);
    setRepairMessage(null);
    const id = project?.id ?? newProjectId();
    // URL se bo spremenil v ?projekt=id; projekta ne nalagamo znova iz shrambe.
    loadedProject.current = id;
    setProject((current) =>
      current
        ? { ...current, name }
        : { id, name, createdAt: new Date().toISOString() },
    );
    setStep(4);
  }

  /* ------------------------------------------------------ preverjanje vnosa */

  function validateInput(): string | null {
    if (mode === "besedilo") {
      if (prompt.trim().length < 3)
        return "Opiši predmet z vsaj nekaj besedami.";
      if (isBlockedContent(prompt)) return BLOCKED_MESSAGE;
    }
    if (mode === "slika") {
      if (!images.length) return "Dodaj vsaj eno sliko.";
      if (prompt && isBlockedContent(prompt)) return BLOCKED_MESSAGE;
      if (!rights) return "Potrdi, da imaš pravico uporabiti naložene slike.";
    }
    if (mode === "model") {
      if (!modelFile) return "Izberi datoteko 3D modela.";
      if (!rights) return "Potrdi, da imaš pravico uporabiti naloženi model.";
    }
    return null;
  }

  function goToSettings() {
    const error = validateInput();
    setInputError(error);
    if (!error) setStep(3);
  }

  /* ----------------------------------------------------------- ustvarjanje */

  async function create() {
    const error = validateInput();
    if (error) {
      setInputError(error);
      setStep(2);
      return;
    }
    setGenerationError(null);
    setGenerating(true);
    setStage(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const useAi = providerMode === "ai" && mode !== "model";
    let stageTimer: ReturnType<typeof setInterval> | null = null;
    if (!useAi) {
      stageTimer = setInterval(
        () => setStage((s) => Math.min(s + 1, PROGRESS_STAGES.length - 1)),
        450,
      );
    }
    try {
      if (useAi) {
        const spec = await generateWithAi({
          kind: mode === "slika" ? "slika" : "besedilo",
          prompt,
          images: images.map((i) => i.file),
          targetMaxMm: targetMm ?? 80,
          signal: controller.signal,
          onProgress: (p) => setStage(p < 40 ? 0 : p < 85 ? 1 : 2),
        });
        startNewModel(
          { type: "mesh", spec, rotation: { ...NO_ROTATION } },
          "Ustvarjen model",
          nameFromPrompt(
            prompt,
            mode === "slika" ? "Model iz slike" : "AI model",
          ),
          [
            `Model je ustvaril ponudnik ${provider?.name ?? "AI"}. Velikost smo nastavili na ${Math.round(targetMm ?? 80)} mm; preveri jo.`,
          ],
        );
      } else if (mode === "besedilo") {
        await sleep(1400);
        const { spec, notes: specNotes } = specFromPrompt(
          prompt,
          settings,
          targetMm,
        );
        startNewModel(
          parametricSource(spec),
          "Ustvarjen model",
          nameFromPrompt(prompt),
          specNotes,
        );
      } else if (mode === "slika") {
        await sleep(900);
        const { spec, notes: reliefNotes } = await reliefFromImage(
          images[0].file,
          targetMm,
          invertRelief,
        );
        const extra =
          images.length > 1
            ? [
                "V demo načinu uporabimo samo prvo sliko; več slik upošteva ponudnik umetne inteligence.",
              ]
            : [];
        startNewModel(
          parametricSource(spec),
          "Ustvarjen relief",
          prompt.trim() ? nameFromPrompt(prompt) : "Relief iz slike",
          [...reliefNotes, ...extra],
        );
      } else if (mode === "model" && modelFile) {
        const { spec, notes: loadNotes } = await loadModelFile(
          modelFile,
          targetMm ?? 80,
        );
        let finalSpec = spec;
        if (targetMm) {
          const maxDim =
            Math.max(spec.widthMm, spec.depthMm, spec.heightMm) || 1;
          const f = targetMm / maxDim;
          finalSpec = {
            ...spec,
            widthMm: spec.widthMm * f,
            depthMm: spec.depthMm * f,
            heightMm: spec.heightMm * f,
          };
        }
        startNewModel(
          { type: "mesh", spec: finalSpec, rotation: { ...NO_ROTATION } },
          "Naložen model",
          modelFile.name.replace(/\.[^.]+$/, ""),
          loadNotes,
        );
      }
    } catch (err) {
      setGenerationError(
        err instanceof FriendlyError
          ? err.message
          : "Pri ustvarjanju je prišlo do napake. Poskusi znova ali spremeni opis.",
      );
    } finally {
      if (stageTimer) clearInterval(stageTimer);
      setGenerating(false);
      abortRef.current = null;
    }
  }

  /* ---------------------------------------------------------------- slike */

  function addImages(files: File[]) {
    setInputError(null);
    const max = provider?.maxImages ?? 3;
    const next = [...images];
    for (const file of files) {
      if (next.length >= max) {
        setInputError(`Dodaš lahko največ ${max} slike.`);
        break;
      }
      try {
        validateImageFile(file);
        next.push({ file, url: URL.createObjectURL(file) });
      } catch (err) {
        setInputError(
          err instanceof FriendlyError
            ? err.message
            : "Slike ni bilo mogoče dodati.",
        );
      }
    }
    setImages(next);
  }

  function removeImage(index: number) {
    setImages((list) => {
      URL.revokeObjectURL(list[index].url);
      return list.filter((_, i) => i !== index);
    });
  }

  /* --------------------------------------------------------------- popravek */

  async function repair() {
    if (!source || !geometry) return;
    setRepairing(true);
    setRepairMessage(null);
    await sleep(50);
    try {
      const messages: string[] = [];
      let next: ModelSource = source;
      if (source.type === "mesh") {
        const result = repairPositions(source.spec.positions);
        next = {
          ...source,
          spec: { ...source.spec, positions: result.positions },
        };
        if (result.filledHoles)
          messages.push(`zaprtih lukenj: ${result.filledHoles}`);
        if (result.removedDegenerate)
          messages.push(
            `odstranjenih ploskev brez površine: ${result.removedDegenerate}`,
          );
        if (result.removedDuplicates)
          messages.push(
            `odstranjenih podvojenih ploskev: ${result.removedDuplicates}`,
          );
      }
      const size = analysis?.size;
      if (size) {
        const factor = Math.min(
          (BUILD_VOLUME_MM.x * 0.95) / size.x,
          (BUILD_VOLUME_MM.y * 0.95) / size.y,
          (BUILD_VOLUME_MM.z * 0.95) / size.z,
        );
        if (factor < 1) {
          next = {
            ...next,
            spec: {
              ...next.spec,
              widthMm: next.spec.widthMm * factor,
              depthMm: next.spec.depthMm * factor,
              heightMm: next.spec.heightMm * factor,
            },
          } as ModelSource;
          messages.push("model pomanjšan, da se prilega tiskalni plošči");
        }
      }
      if (
        next.type === "parametric" &&
        analysis?.checks.some(
          (c) => c.id === "stene" && c.status === "opozorilo",
        )
      ) {
        next = {
          ...next,
          spec: {
            ...next.spec,
            wallMm: Math.max(next.spec.wallMm, WALL_MM.obicajno),
          },
        };
        messages.push("stene odebeljene na 2 mm");
      }
      if (next === source) {
        setRepairMessage(
          "Samodejni popravek ni našel ničesar, kar bi lahko popravil. Poskusi spremeniti velikost ali uporabi program za tisk.",
        );
      } else {
        applyChange(next, "Samodejni popravek");
        setRepairMessage(
          `Popravek končan: ${messages.join(", ")}. Preveri rezultat.`,
        );
      }
    } catch {
      setRepairMessage(
        "Popravek ni uspel. Model popravi v programu za 3D modeliranje ali tisk.",
      );
    } finally {
      setRepairing(false);
    }
  }

  /* ----------------------------------------------------------------- izvoz */

  const fileBase = slugify(project?.name ?? "model");

  async function exportFile(kind: "stl" | "glb" | "zip") {
    if (!geometry) return;
    setExportBusy(kind);
    setExportMessage(null);
    try {
      const positions = geometry.getAttribute("position").array as Float32Array;
      const name = project?.name ?? "Model";
      if (kind === "stl") {
        downloadBlob(
          toBinaryStl(positions, name),
          `${fileBase}.stl`,
          "model/stl",
        );
      } else if (kind === "glb") {
        downloadBlob(
          await toGlb(positions, settings.color, name),
          `${fileBase}.glb`,
          "model/gltf-binary",
        );
      } else {
        setExportMessage("Pripravljam model …");
        const stl = new Uint8Array(toBinaryStl(positions, name));
        await sleep(250);
        setExportMessage("Dodajam specifikacijo …");
        const glb = new Uint8Array(
          await toGlb(positions, settings.color, name),
        );
        const report =
          analysis ??
          analyzeGeometry(geometry, {
            recommendedWallMm: WALL_MM[settings.wall],
          });
        const spec = buildSpecText({
          name,
          analysis: report,
          settings,
          formats: ["STL", "GLB"],
        });
        await sleep(250);
        setExportMessage("Pakiram datoteke …");
        const zip = createZip([
          { name: `${fileBase}.stl`, data: stl },
          { name: `${fileBase}.glb`, data: glb },
          { name: "specifikacija.txt", data: new TextEncoder().encode(spec) },
        ]);
        downloadBlob(zip, `${fileBase}-za-tisk.zip`, "application/zip");
        setExportMessage(
          "Paket je pripravljen. Pošlji ga tiskarni ali ga odpri v programu za tisk.",
        );
      }
    } catch {
      setExportMessage("Datoteke ni bilo mogoče pripraviti. Poskusi znova.");
    } finally {
      setExportBusy(null);
    }
  }

  /* -------------------------------------------------------------- ponastavi */

  function resetAll() {
    abortRef.current?.abort();
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setStep(1);
    setMode(null);
    setPrompt("");
    setImages([]);
    setModelFile(null);
    setRights(false);
    setSource(null);
    setHistory([]);
    setCurrentHistoryId(null);
    setNotes([]);
    setProject(null);
    setGenerationError(null);
    setInputError(null);
    setSaveState("idle");
    loadedProject.current = null;
    router.replace("/studio", { scroll: false });
  }

  /* --------------------------------------------------------------- prikaz */

  const maxReachable: Step = source ? 5 : mode ? 3 : 1;
  const modeTitle = MODES.find((m) => m.value === mode)?.title ?? "";
  const status = !source
    ? { label: "Ni še modela", cls: "bg-white/10 text-fg-muted" }
    : !analysis || analyzing
      ? { label: "Preverjam …", cls: "bg-white/10 text-fg-muted" }
      : analysis.ready
        ? { label: "Pripravljen za tisk", cls: "bg-success/15 text-success" }
        : { label: "Potrebuje popravek", cls: "bg-signal/15 text-signal" };

  const inputSummary =
    mode === "besedilo"
      ? prompt || "Brez opisa"
      : mode === "slika"
        ? `${images.length} ${images.length === 1 ? "slika" : images.length === 2 ? "sliki" : "slike"}`
        : mode === "model"
          ? (modelFile?.name ?? "Brez datoteke")
          : "";

  const stepSection = (
    n: 1 | 2 | 3,
    title: string,
    summary: string,
    body: ReactNode,
  ) => {
    const open = step === n;
    return (
      <div className={cx(open ? "block" : "hidden lg:block")}>
        {open ? (
          <Panel title={`${n}. ${title}`} id={`korak-${n}`}>
            {body}
          </Panel>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-surface-1 px-5 py-4 ring-1 ring-white/[0.07]">
            <div className="min-w-0">
              <p className="font-display font-semibold text-fg">
                {n}. {title}
              </p>
              {summary ? (
                <p className="mt-0.5 truncate text-sm text-fg-subtle">
                  {summary}
                </p>
              ) : null}
            </div>
            {n <= maxReachable ? (
              <button
                type="button"
                className={smallButton}
                onClick={() => setStep(n)}
              >
                {n < step ? "Spremeni" : "Odpri"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const rightsCheckbox = (
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-fg-muted">
      <input
        type="checkbox"
        checked={rights}
        onChange={(event) => setRights(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-accent"
      />
      <span>
        Potrjujem, da imam pravico uporabiti naložene datoteke in da ne
        prikazujejo orožja ali drugih prepovedanih vsebin.{" "}
        <Link
          href="/pomoc#pravila"
          className="text-accent underline underline-offset-2"
        >
          Pravila uporabe
        </Link>
      </span>
    </label>
  );

  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-24 sm:px-6 lg:px-8">
      {/* koraki */}
      <nav aria-label="Koraki ustvarjanja" className="mt-6">
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {STEPS.map((s) => {
            const enabled = s.n <= maxReachable && !generating;
            const current = s.n === step;
            return (
              <li key={s.n} className="shrink-0">
                <button
                  type="button"
                  disabled={!enabled}
                  ref={
                    current
                      ? (el) =>
                          el?.scrollIntoView({
                            block: "nearest",
                            inline: "center",
                          })
                      : undefined
                  }
                  aria-current={current ? "step" : undefined}
                  onClick={() => setStep(s.n)}
                  className={cx(
                    "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    current
                      ? "bg-accent font-semibold text-accent-ink"
                      : "bg-surface-1 text-fg-muted ring-1 ring-white/10 hover:text-fg",
                  )}
                >
                  <span
                    className={cx(
                      "grid size-6 place-items-center rounded-full text-xs",
                      current ? "bg-accent-ink/15" : "bg-white/10",
                    )}
                  >
                    {s.n}
                  </span>
                  <span className={cx(current ? "inline" : "hidden sm:inline")}>
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {providerMode === "demo" ? (
        <div className="mt-4">
          <Notice title="Demo način">
            Ponudnik umetne inteligence ni povezan, zato modele sestavimo iz
            preprostih predlog (besedilo) ali kot relief (slika). Celoten
            postopek do prenosa datoteke deluje.
          </Notice>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)_minmax(0,23rem)] lg:items-start">
        {/* LEVO: vnos, nastavitve, zgodovina */}
        <div
          className={cx(
            step >= 4 ? "hidden lg:grid" : "grid",
            "grid-cols-1 content-start gap-4",
          )}
        >
          {stepSection(
            1,
            "Izberi način",
            modeTitle,
            <ModeSelector
              value={mode}
              onSelect={(m) => {
                setMode(m);
                setInputError(null);
                setStep(2);
              }}
            />,
          )}

          {stepSection(
            2,
            "Vnos",
            inputSummary,
            <div className="grid gap-5">
              {mode === "besedilo" ? (
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  settings={settings}
                />
              ) : null}
              {mode === "slika" ? (
                <>
                  <FileDrop
                    label="Naloži sliko"
                    help={`Fotografija, skica ali koncept (PNG, JPG, WEBP, do 15 MB). Največ ${provider?.maxImages ?? 3} referenčne slike.`}
                    accept={IMAGE_TYPES.join(",")}
                    multiple
                    onFiles={addImages}
                  />
                  {images.length ? (
                    <ul
                      className="grid grid-cols-3 gap-2"
                      aria-label="Naložene slike"
                    >
                      {images.map((image, index) => (
                        <li key={image.url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.url}
                            alt={`Naložena slika ${index + 1}: ${image.file.name}`}
                            className="aspect-square w-full rounded-xl object-cover ring-1 ring-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Odstrani sliko ${index + 1}`}
                            className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-bg/85 text-fg ring-1 ring-white/15"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              className="size-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M5 5l10 10M15 5L5 15" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {providerMode === "demo" ? (
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-fg-muted">
                      <input
                        type="checkbox"
                        checked={invertRelief}
                        onChange={(event) =>
                          setInvertRelief(event.target.checked)
                        }
                        className="mt-0.5 size-5 shrink-0 accent-accent"
                      />
                      Svetlejši deli slike naj bodo višji (privzeto so višji
                      temnejši deli, kar ustreza skicam).
                    </label>
                  ) : null}
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    settings={settings}
                    required={false}
                    label="Dodaten opis"
                  />
                  {rightsCheckbox}
                </>
              ) : null}
              {mode === "model" ? (
                <>
                  <FileDrop
                    label="Izberi datoteko"
                    help="STL, OBJ ali GLB, do 60 MB. STL naj bo v milimetrih."
                    accept=".stl,.obj,.glb"
                    onFiles={(files) => {
                      setInputError(null);
                      setModelFile(files[0] ?? null);
                    }}
                  />
                  {modelFile ? (
                    <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg">
                      Izbrana datoteka:{" "}
                      <span className="font-medium">{modelFile.name}</span>
                    </p>
                  ) : null}
                  {rightsCheckbox}
                </>
              ) : null}
              {inputError ? (
                <p role="alert" className="text-sm text-danger">
                  {inputError}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setStep(1)}
                >
                  Nazaj
                </button>
                <button
                  type="button"
                  className={primaryButton}
                  onClick={goToSettings}
                >
                  Naprej
                </button>
              </div>
            </div>,
          )}

          {stepSection(
            3,
            "Nastavitve",
            "",
            <div className="grid gap-6">
              <SettingsPanel
                settings={settings}
                onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                sizeValue={sizeText}
                onSizeChange={setSizeText}
                sizeHelp={
                  mode === "model"
                    ? "Pusti prazno, da ohraniš velikost iz datoteke."
                    : "Pusti prazno za samodejno velikost (ali mere iz opisa)."
                }
              />
              {generationError ? (
                <Notice tone="error" title="Ustvarjanje ni uspelo">
                  {generationError}
                </Notice>
              ) : null}
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setStep(2)}
                  disabled={generating}
                >
                  Nazaj
                </button>
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => void create()}
                  disabled={generating}
                >
                  {generating
                    ? "Ustvarjam …"
                    : mode === "model"
                      ? "Pripravi predogled"
                      : "Ustvari model"}
                </button>
              </div>
            </div>,
          )}

          {source ? (
            <div className="hidden lg:block">
              <Panel title="Zgodovina sprememb" id="zgodovina">
                <HistoryPanel
                  entries={history}
                  currentId={currentHistoryId}
                  onRestore={(id) => {
                    const entry = history.find((h) => h.id === id);
                    if (entry) {
                      setSource(entry.source);
                      setCurrentHistoryId(id);
                    }
                  }}
                />
              </Panel>
            </div>
          ) : null}
        </div>

        {/* SREDINA: 3D predogled */}
        <div
          className={cx(
            step >= 4 || generating ? "block" : "hidden lg:block",
            "lg:sticky lg:top-20",
          )}
        >
          <div className="relative h-[52vh] min-h-[20rem] lg:h-[calc(100vh-8rem)] lg:max-h-[52rem]">
            <ModelViewer
              ref={viewerRef}
              geometry={geometry}
              color={settings.color}
              surface={settings.surface}
              fitKey={modelKey}
              label={project ? `3D predogled: ${project.name}` : "3D predogled"}
            />
            {!source && !generating ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-8 text-center">
                <div>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    className="mx-auto size-14 text-accent/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  >
                    <path d="M24 6l15 8.5v19L24 42 9 33.5v-19zM24 24l15-9.5M24 24v18M24 24L9 14.5" />
                  </svg>
                  <p className="mt-4 font-display text-xl font-semibold text-fg">
                    Tukaj se bo prikazal tvoj 3D model
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">
                    Izberi način, dodaj opis ali datoteko in klikni »Ustvari
                    model«.
                  </p>
                </div>
              </div>
            ) : null}
            {generating ? (
              <div
                className="absolute inset-0 grid place-items-center rounded-[1.5rem] bg-bg/80 p-8 text-center backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <div className="w-full max-w-sm">
                  <span
                    aria-hidden="true"
                    className="mx-auto block size-10 animate-spin rounded-full border-4 border-accent/25 border-t-accent motion-reduce:animate-none"
                  />
                  <p className="mt-5 font-display text-xl font-semibold text-fg">
                    {PROGRESS_STAGES[stage]}
                  </p>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{
                        width: `${((stage + 1) / PROGRESS_STAGES.length) * 100}%`,
                      }}
                    />
                  </div>
                  {providerMode === "ai" && mode !== "model" ? (
                    <>
                      <p className="mt-3 text-sm text-fg-muted">
                        Ustvarjanje z umetno inteligenco lahko traja nekaj
                        minut.
                      </p>
                      <button
                        type="button"
                        className={`${smallButton} mt-4`}
                        onClick={() => abortRef.current?.abort()}
                      >
                        Prekliči
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* DESNO: stanje, urejanje, tisk */}
        <div
          className={cx(
            step >= 4 ? "grid" : "hidden lg:grid",
            "grid-cols-1 content-start gap-4",
          )}
        >
          <Panel
            title="Stanje modela"
            id="stanje"
            actions={
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}
              >
                {status.label}
              </span>
            }
          >
            {source && project ? (
              <div className="grid gap-3">
                <label
                  className="block text-sm font-medium text-fg"
                  htmlFor="ime-projekta"
                >
                  Ime projekta
                </label>
                <input
                  id="ime-projekta"
                  type="text"
                  value={project.name}
                  maxLength={60}
                  onChange={(event) =>
                    setProject({
                      ...project,
                      name: event.target.value || "Model",
                    })
                  }
                  className="block w-full min-h-11 rounded-xl border border-white/10 bg-surface-2 px-3.5 text-base text-fg focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                />
                <p className="text-xs text-fg-subtle" role="status">
                  {saveState === "saving"
                    ? "Shranjujem v Moji modeli …"
                    : saveState === "saved"
                      ? "Shranjeno v Moji modeli (v tem brskalniku)."
                      : saveState === "error"
                        ? "Shranjevanje v brskalnik ni uspelo."
                        : ""}
                </p>
                {notes.length ? (
                  <ul className="grid gap-2">
                    {notes.map((note) => (
                      <li key={note}>
                        <Notice>{note}</Notice>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-fg-muted">
                Ko ustvariš model, tukaj vidiš njegovo stanje, priporočila in
                naslednje korake.
              </p>
            )}
          </Panel>

          {source && step === 4 ? (
            <>
              <Panel title="4. Uredi model" id="korak-4">
                <EditorControls
                  source={source}
                  unit={settings.unit}
                  onChange={applyChange}
                />
              </Panel>
              {mode === "besedilo" ? (
                <Panel title="Ustvari znova" id="ponovno">
                  <div className="grid gap-3">
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      settings={settings}
                      label="Izboljšan opis"
                    />
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => void create()}
                      disabled={generating}
                    >
                      Ustvari znova z novim opisom
                    </button>
                  </div>
                </Panel>
              ) : null}
              <div className="lg:hidden">
                <Panel title="Zgodovina sprememb" id="zgodovina-mobilno">
                  <HistoryPanel
                    entries={history}
                    currentId={currentHistoryId}
                    onRestore={(id) => {
                      const entry = history.find((h) => h.id === id);
                      if (entry) {
                        setSource(entry.source);
                        setCurrentHistoryId(id);
                      }
                    }}
                  />
                </Panel>
              </div>
              <button
                type="button"
                className={primaryButton}
                onClick={() => setStep(5)}
              >
                Naprej: Pripravi za tisk
              </button>
            </>
          ) : null}

          {source && step === 5 ? (
            <>
              <Panel title="5. Pripravi za tisk" id="korak-5">
                <PrintReadinessPanel
                  analysis={analysis}
                  analyzing={analyzing}
                  settings={settings}
                  unit={settings.unit}
                  onRepair={() => void repair()}
                  repairing={repairing}
                  repairMessage={repairMessage}
                />
              </Panel>
              <Panel title="Prenesi datoteko" id="prenos">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => void exportFile("stl")}
                      disabled={Boolean(exportBusy)}
                    >
                      {exportBusy === "stl" ? "Pripravljam …" : "Prenesi STL"}
                    </button>
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => void exportFile("glb")}
                      disabled={Boolean(exportBusy)}
                    >
                      {exportBusy === "glb" ? "Pripravljam …" : "Prenesi GLB"}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-fg-subtle">
                    STL odpreš v programu za tisk (slicerju). GLB je primeren za
                    ogled in deljenje 3D modela.
                  </p>
                  <button
                    type="button"
                    className={primaryButton}
                    onClick={() => void exportFile("zip")}
                    disabled={Boolean(exportBusy)}
                  >
                    {exportBusy === "zip"
                      ? "Pripravljam paket …"
                      : "Pripravi datoteko za pošiljanje"}
                  </button>
                  <p className="text-xs leading-relaxed text-fg-subtle">
                    Paket ZIP vsebuje model (STL in GLB) in specifikacijo z
                    merami, materialom in opombami za tisk. Pošiljanje tiskarni
                    še ni povezano; paket pošlješ sam.
                  </p>
                  {exportMessage ? (
                    <p role="status" className="text-sm text-fg-muted">
                      {exportMessage}
                    </p>
                  ) : null}
                </div>
              </Panel>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setStep(4)}
              >
                Nazaj na urejanje
              </button>
            </>
          ) : null}

          {source ? (
            <button type="button" className={smallButton} onClick={resetAll}>
              Začni nov model
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

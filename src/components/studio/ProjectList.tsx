"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type ProjectStatus,
  type ProjectSummary,
  deleteProject,
  listProjects,
} from "@/lib/model3d/storage";

import { primaryButton, smallButton } from "./ui";

const STATUS: Record<ProjectStatus, { label: string; cls: string }> = {
  osnutek: { label: "Osnutek", cls: "bg-white/10 text-fg-muted" },
  pripravljen: {
    label: "Pripravljen za tisk",
    cls: "bg-success/15 text-success",
  },
  "potrebuje-popravek": {
    label: "Potrebuje popravek",
    cls: "bg-signal/15 text-signal",
  },
};

const SOURCE_LABEL = {
  besedilo: "Iz besedila",
  slika: "Iz slike",
  model: "Naložen model",
} as const;

function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectSummary;
  onDelete: (id: string) => void;
}) {
  const status = STATUS[project.status];
  const date = new Date(project.updatedAt).toLocaleString("sl-SI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <article
      aria-labelledby={`projekt-${project.id}`}
      className="flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-surface-1 ring-1 ring-white/[0.07]"
    >
      <div className="relative aspect-[4/3] bg-[#0b0e11]">
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={`Sličica modela ${project.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-fg-subtle">
            Brez sličice
          </div>
        )}
        <span
          className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${status.cls}`}
        >
          {status.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2
          id={`projekt-${project.id}`}
          className="font-display text-xl font-semibold tracking-tight text-fg"
        >
          {project.name}
        </h2>
        <p className="mt-1 text-sm text-fg-subtle">
          {SOURCE_LABEL[project.mode]} ·{" "}
          <time dateTime={project.updatedAt}>{date}</time>
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/studio?projekt=${project.id}`}
            className={primaryButton
              .replace("min-h-12", "min-h-11")
              .replace("text-base", "text-sm")}
          >
            Nadaljuj urejanje
          </Link>
          <button
            type="button"
            className={smallButton}
            onClick={() => {
              if (
                window.confirm(
                  `Ali res želiš izbrisati projekt »${project.name}«?`,
                )
              )
                onDelete(project.id);
            }}
          >
            Izbriši
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-2xl bg-surface-1 p-6 text-fg-muted ring-1 ring-white/[0.07]"
      >
        Shranjenih modelov ni bilo mogoče prebrati. Morda brskalnik ne dovoli
        shranjevanja (npr. v zasebnem načinu).
      </p>
    );
  }
  if (!projects) {
    return (
      <p role="status" className="text-fg-muted">
        Nalagam modele …
      </p>
    );
  }
  if (!projects.length) {
    return (
      <div className="rounded-[1.75rem] bg-surface-1 p-10 text-center ring-1 ring-white/[0.07]">
        <p className="font-display text-2xl font-semibold text-fg">
          Še nimaš shranjenih modelov
        </p>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">
          Ko v Studiu ustvariš ali naložiš model, se samodejno shrani sem.
        </p>
        <Link href="/studio" className={`${primaryButton} mt-7`}>
          Ustvari prvi model
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            onDelete={(id) => {
              void deleteProject(id).then(() =>
                setProjects((list) =>
                  list ? list.filter((p) => p.id !== id) : list,
                ),
              );
            }}
          />
        </li>
      ))}
    </ul>
  );
}

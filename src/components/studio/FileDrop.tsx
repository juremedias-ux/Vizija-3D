"use client";

import { useId, useRef, useState } from "react";

/** Območje za vlečenje in spuščanje datotek z rezervnim gumbom za izbiro. */
export function FileDrop({
  label,
  help,
  accept,
  multiple,
  onFiles,
  disabled,
}: {
  label: string;
  help: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        const files = Array.from(event.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
        dragging ? "border-accent bg-accent/10" : "border-white/15 bg-surface-2"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mx-auto size-8 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 16V4M7 9l5-5 5 5M4 16v3h16v-3" />
      </svg>
      <p className="mt-3 font-medium text-fg">Povleci datoteko sem</p>
      <p
        id={`${id}-namig`}
        className="mt-1 text-xs leading-relaxed text-fg-subtle"
      >
        {help}
      </p>
      <label
        htmlFor={id}
        className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] px-5 text-sm font-medium text-fg ring-1 ring-white/15 ring-inset transition-colors hover:bg-white/[0.14] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
      >
        {label}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={`${id}-namig`}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) onFiles(files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
    </div>
  );
}

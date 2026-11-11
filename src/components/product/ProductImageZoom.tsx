"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Slika izdelka, ki se ob kliku odpre v povečanem prikazu (modalno okno).
 * Zapiranje: gumb »Zapri«, tipka Escape ali klik ob sliki.
 */
export function ProductImageZoom({
  src,
  alt,
  productName,
  isConcept,
  priority = false,
}: {
  src: string;
  alt: string;
  productName: string;
  isConcept: boolean;
  priority?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const unoptimized = src.endsWith(".svg");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();
  }, [open]);

  function close() {
    dialogRef.current?.close();
  }

  function handleClosed() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-surface-2 text-left focus-visible:outline-offset-[-3px]"
        aria-label={`Povečaj sliko: ${productName}`}
        aria-haspopup="dialog"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          unoptimized={unoptimized}
          priority={priority}
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-bg/85 px-2.5 py-1.5 font-mono text-xs text-fg-muted transition-colors group-hover:border-accent group-hover:text-accent">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l4 4M8.5 6v5M6 8.5h5" />
          </svg>
          Povečaj
        </span>
        {isConcept ? (
          <span className="absolute top-3 left-3 rounded-md border border-line-strong bg-bg/85 px-2.5 py-1 font-mono text-[11px] tracking-wide text-fg-muted uppercase">
            Konceptna grafika
          </span>
        ) : null}
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClose={handleClosed}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none rounded-xl border border-line-strong bg-surface-1 p-0 text-fg backdrop:bg-bg/90"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
            <h2 id={titleId} className="font-display text-lg font-semibold">
              {productName}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong px-3 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
              Zapri
            </button>
          </div>
          <div className="relative aspect-[4/3] max-h-[75dvh] w-full bg-surface-2">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="object-contain"
              unoptimized={unoptimized}
            />
          </div>
          {isConcept ? (
            <p className="border-t border-line px-4 py-3 font-mono text-xs text-fg-subtle sm:px-5">
              Konceptna grafika — fotografija izdelka bo dodana.
            </p>
          ) : null}
        </dialog>
      ) : null}
    </>
  );
}

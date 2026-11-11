"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/styles";
import { navigation } from "@/config/site";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        close(false);
      }
    }
    // Meni se zapre, ko se zaslon razširi do namizne postavitve.
    const desktop = window.matchMedia("(min-width: 1024px)");
    function onDesktop(event: MediaQueryListEvent) {
      if (event.matches) close(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open, close]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/95 supports-[backdrop-filter]:bg-bg/85 supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Glavna navigacija" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:contents">
            <Link href="/#izdelki" className={buttonClasses("primary", "md")}>
              Razišči izdelke
            </Link>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong text-fg transition-colors hover:border-accent hover:text-accent lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Zapri meni" : "Odpri meni"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h10" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={panelRef}
        id={menuId}
        hidden={!open}
        className="border-t border-line bg-bg lg:hidden"
      >
        <nav
          aria-label="Mobilna navigacija"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6"
        >
          <ul className="flex flex-col">
            {navigation.map((item) => (
              <li
                key={item.href}
                className="border-b border-line/70 last:border-b-0"
              >
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center justify-between rounded-md px-1 text-base text-fg transition-colors hover:text-accent"
                  onClick={() => close(false)}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs text-fg-subtle"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#izdelki"
            className={buttonClasses("primary", "lg", "mt-4 w-full sm:hidden")}
            onClick={() => close(false)}
          >
            Razišči izdelke
          </Link>
        </nav>
      </div>
    </header>
  );
}

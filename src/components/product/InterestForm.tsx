"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { buttonClasses, inputClasses } from "@/components/ui/styles";
import {
  CONSENT_TEXT,
  CONSENT_TEXT_VERSION,
  EMAIL_USAGE_TEXT,
  NON_BINDING_NOTICE,
} from "@/lib/interest/consent";
import type { InterestResponse } from "@/lib/interest/types";
import { useHydrated } from "@/lib/use-hydrated";
import {
  type FieldErrors,
  HONEYPOT_FIELD,
  QUANTITY_MAX,
  QUANTITY_MIN,
  parseQuantity,
  validateConsent,
  validateEmail,
  validateQuantity,
} from "@/lib/interest/validation";
import { useInterestSession } from "./InterestSession";
import { QuantityInput } from "./QuantityInput";

const REQUEST_TIMEOUT_MS = 15_000;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; retryable: boolean }
  | { kind: "success"; email: string; quantity: number; updated: boolean };

export function InterestForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const uid = useId();
  const ids = {
    quantity: `${uid}-kolicina`,
    quantityHint: `${uid}-kolicina-namig`,
    quantityError: `${uid}-kolicina-napaka`,
    email: `${uid}-eposta`,
    emailHint: `${uid}-eposta-namig`,
    emailError: `${uid}-eposta-napaka`,
    consent: `${uid}-privolitev`,
    consentError: `${uid}-privolitev-napaka`,
    notice: `${uid}-obvestilo`,
    honeypot: `${uid}-hp`,
  };

  const hydrated = useHydrated();
  const session = useInterestSession();
  const [quantity, setQuantity] = useState("1");
  // null pomeni: uporabi naslov, ki je bil v tem obisku že uspešno oddan.
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const email = emailInput ?? session.email;
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const inFlight = useRef(false);
  const quantityRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const submitting = status.kind === "submitting";
  // Naslov se lahko spremeni tudi brez tipkanja (predizpolnitev iz tega obiska).
  const emailError =
    errors.email && validateEmail(email) ? errors.email : undefined;

  useEffect(() => {
    if (status.kind === "success") successRef.current?.focus();
    if (status.kind === "error") errorRef.current?.focus();
  }, [status.kind]);

  function validateAll(): FieldErrors {
    const next: FieldErrors = {};
    const q = validateQuantity(quantity);
    if (q) next.quantity = q;
    const e = validateEmail(email);
    if (e) next.email = e;
    const c = validateConsent(consent);
    if (c) next.consent = c;
    return next;
  }

  function focusFirstError(next: FieldErrors) {
    if (next.quantity) quantityRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.consent) consentRef.current?.focus();
  }

  function clearError(field: keyof FieldErrors) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit() {
    if (inFlight.current) return;

    const nextErrors = validateAll();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (status.kind === "error") setStatus({ kind: "idle" });
      focusFirstError(nextErrors);
      return;
    }

    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) return;

    inFlight.current = true;
    setStatus({ kind: "submitting" });

    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch("/api/zanimanje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          email: email.trim(),
          quantity: parsedQuantity,
          consent,
          consentVersion: CONSENT_TEXT_VERSION,
          [HONEYPOT_FIELD]: honeypot,
        }),
        signal: controller.signal,
      });

      let data: InterestResponse | null = null;
      try {
        data = (await response.json()) as InterestResponse;
      } catch {
        data = null;
      }

      if (response.ok && data?.ok === true) {
        session.setEmail(data.email);
        setStatus({
          kind: "success",
          email: data.email,
          quantity: data.quantity,
          updated: data.updated,
        });
        return;
      }

      if (
        data &&
        data.ok === false &&
        data.error === "validation" &&
        data.fieldErrors
      ) {
        const serverErrors: FieldErrors = { ...data.fieldErrors };
        setErrors(serverErrors);
        if (serverErrors.productId) {
          setStatus({
            kind: "error",
            message: serverErrors.productId,
            retryable: false,
          });
        } else {
          setStatus({ kind: "idle" });
          focusFirstError(serverErrors);
        }
        return;
      }

      const message =
        data && data.ok === false
          ? data.message
          : "Pošiljanje ni uspelo zaradi napake na strežniku.";
      setStatus({
        kind: "error",
        message,
        retryable: !(data && data.ok === false && data.error === "rejected"),
      });
    } catch {
      setStatus({
        kind: "error",
        message: controller.signal.aborted
          ? "Strežnik se ni odzval pravočasno."
          : "Povezava s strežnikom ni uspela. Preveri internetno povezavo.",
        retryable: true,
      });
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  if (status.kind === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-lg border border-success/35 bg-success/5 p-5 outline-none focus-visible:outline-2 focus-visible:outline-success"
      >
        <p className="flex items-center gap-2 font-display text-lg font-semibold text-success">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M4 10.5l4 4 8-9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Zanimanje je oddano
        </p>
        <p className="mt-3 text-sm leading-relaxed text-fg">
          Hvala za zanimanje! Obvestili te bomo na{" "}
          <strong className="font-semibold [overflow-wrap:anywhere]">
            {status.email}
          </strong>
          , ko bo izdelek na voljo. To ni potrjeno naročilo in plačilo ni bilo
          izvedeno.
        </p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border border-line bg-surface-1 px-4 py-3 text-sm">
          <dt className="text-fg-subtle">Izdelek</dt>
          <dd className="font-medium text-fg">{productName}</dd>
          <dt className="text-fg-subtle">Količina</dt>
          <dd className="font-mono font-medium text-fg">{status.quantity}</dd>
        </dl>
        {status.updated ? (
          <p className="mt-3 text-sm text-fg-muted">
            Za ta izdelek si zanimanje že oddal, zato smo količino posodobili na
            zadnjo izbrano.
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="#izdelki" className={buttonClasses("secondary", "md")}>
            Nadaljuj z ogledom izdelkov
          </Link>
          <button
            type="button"
            className={buttonClasses(
              "ghost",
              "md",
              "underline underline-offset-4",
            )}
            onClick={() => {
              setStatus({ kind: "idle" });
              window.setTimeout(() => quantityRef.current?.focus(), 0);
            }}
          >
            Spremeni količino
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-busy={submitting}
      aria-label={`Oddaja zanimanja: ${productName}`}
      className="relative grid gap-5"
    >
      <div>
        <label
          htmlFor={ids.quantity}
          className="block text-sm font-medium text-fg"
        >
          Količina
        </label>
        <p id={ids.quantityHint} className="mt-1 text-xs text-fg-subtle">
          Celo število od {QUANTITY_MIN} do {QUANTITY_MAX}.
        </p>
        <div className="mt-2">
          <QuantityInput
            ref={quantityRef}
            id={ids.quantity}
            value={quantity}
            onChange={(value) => {
              setQuantity(value);
              if (errors.quantity && !validateQuantity(value))
                clearError("quantity");
            }}
            error={errors.quantity}
            errorId={ids.quantityError}
            hintId={ids.quantityHint}
            locked={submitting}
          />
        </div>
        {errors.quantity ? (
          <p id={ids.quantityError} className="mt-2 text-sm text-danger">
            {errors.quantity}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={ids.email}
          className="block text-sm font-medium text-fg"
        >
          E-poštni naslov
        </label>
        <input
          ref={emailRef}
          id={ids.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="ime@domena.si"
          value={email}
          readOnly={submitting}
          onChange={(event) => {
            setEmailInput(event.target.value);
            if (errors.email && !validateEmail(event.target.value))
              clearError("email");
          }}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={[ids.emailHint, emailError ? ids.emailError : null]
            .filter(Boolean)
            .join(" ")}
          className={`mt-2 ${inputClasses}`}
        />
        <p
          id={ids.emailHint}
          className="mt-2 text-xs leading-relaxed text-fg-subtle"
        >
          {EMAIL_USAGE_TEXT}{" "}
          <Link
            href="/zasebnost"
            className="text-fg-muted underline underline-offset-2 hover:text-accent"
          >
            Zasebnost
          </Link>
        </p>
        {emailError ? (
          <p id={ids.emailError} className="mt-2 text-sm text-danger">
            {emailError}
          </p>
        ) : null}
      </div>

      {/* Skrito polje za samodejne programe. Resnični obiskovalci ga ne vidijo. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={ids.honeypot}>Tega polja ne izpolnjuj</label>
        <input
          id={ids.honeypot}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            ref={consentRef}
            id={ids.consent}
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              if (submitting) return;
              setConsent(event.target.checked);
              if (event.target.checked) clearError("consent");
            }}
            required
            disabled={!hydrated}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? ids.consentError : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line-strong accent-accent"
          />
          <label
            htmlFor={ids.consent}
            className="cursor-pointer text-sm leading-relaxed text-fg"
          >
            {CONSENT_TEXT}
            <span className="text-fg-subtle"> (obvezno)</span>
          </label>
        </div>
        {errors.consent ? (
          <p id={ids.consentError} className="mt-2 text-sm text-danger">
            {errors.consent}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <p
          id={ids.notice}
          className="flex gap-2.5 rounded-md border border-signal/30 bg-signal/5 px-3.5 py-3 text-sm leading-relaxed text-fg"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="mt-0.5 size-4 shrink-0 text-signal"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 6v5M10 13.5v.5" strokeLinecap="round" />
          </svg>
          {NON_BINDING_NOTICE}
        </p>

        {status.kind === "error" ? (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/5 px-3.5 py-3 text-sm text-fg outline-none focus-visible:outline-2 focus-visible:outline-danger"
          >
            <p className="font-medium text-danger">
              Zanimanja ni bilo mogoče oddati.
            </p>
            <p className="mt-1 text-fg-muted">
              {status.message} Vneseni podatki so ohranjeni.
            </p>
            {status.retryable ? (
              <button
                type="button"
                onClick={() => void submit()}
                className={buttonClasses("secondary", "md", "mt-3")}
              >
                Poskusi znova
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!hydrated}
          aria-disabled={submitting}
          aria-describedby={ids.notice}
          className={buttonClasses(
            "primary",
            "lg",
            "w-full aria-disabled:cursor-progress aria-disabled:opacity-70",
          )}
        >
          {submitting ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-accent-ink/30 border-t-accent-ink motion-reduce:animate-none"
              />
              Pošiljanje …
            </>
          ) : (
            "Oddaj naročilo"
          )}
        </button>
        <p className="sr-only" aria-live="polite">
          {submitting ? "Pošiljanje …" : ""}
        </p>
      </div>
    </form>
  );
}

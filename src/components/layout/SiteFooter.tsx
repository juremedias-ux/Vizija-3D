import Link from "next/link";

import { DEVELOPMENT_NOTICE } from "@/content/copy";
import { navigation, siteConfig } from "@/config/site";
import { CurrentYear } from "./CurrentYear";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { contact, social } = siteConfig;

  return (
    <footer className="border-t border-line bg-surface-1">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
            {siteConfig.description}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-signal/30 bg-signal/5 px-3 py-2 font-mono text-xs text-signal">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-signal"
            />
            {DEVELOPMENT_NOTICE}
          </p>
        </div>

        <nav aria-label="Povezave v nogi" className="md:col-span-4">
          <h2 className="font-mono text-xs tracking-[0.18em] text-fg-subtle uppercase">
            Vsebina
          </h2>
          <ul className="mt-4 grid gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-10 items-center text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/zasebnost"
                className="inline-flex min-h-10 items-center text-sm text-fg-muted transition-colors hover:text-fg"
              >
                Zasebnost
              </Link>
            </li>
          </ul>
        </nav>

        {contact.email || social.length > 0 ? (
          <div className="md:col-span-3">
            <h2 className="font-mono text-xs tracking-[0.18em] text-fg-subtle uppercase">
              Kontakt
            </h2>
            <ul className="mt-4 grid gap-1">
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex min-h-10 items-center text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 font-mono text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © <CurrentYear /> {siteConfig.name}
          </p>
          <p>Brez analitike in oglasnih sledilnikov.</p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { siteConfig } from "@/config/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

const title = "Vizija 3D — 3D-tiskani izdelki za dom in delovni prostor";
const description =
  "Vizija 3D razvija uporabne 3D-tiskane izdelke za dom in delovni prostor. Razišči izdelke v razvoju in oddaj nezavezujoče zanimanje.";

export const metadata: Metadata = {
  metadataBase: siteConfig.url ? new URL(siteConfig.url) : undefined,
  title: {
    default: title,
    template: "%s — Vizija 3D",
  },
  description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "sl_SI",
    siteName: siteConfig.name,
    title,
    description,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sl"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <a
          href="#vsebina"
          className="sr-only z-[100] rounded-md bg-accent px-4 py-3 font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Preskoči na vsebino
        </a>
        <SiteHeader />
        <main id="vsebina" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

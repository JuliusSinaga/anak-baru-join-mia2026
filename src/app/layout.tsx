import type { Metadata, Viewport } from "next"

import { DisclaimerBar } from "@/components/site/disclaimer-bar"
import { Footer } from "@/components/site/footer"
import { Navbar } from "@/components/site/navbar"
import { SITE, siteUrl } from "@/lib/site"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["JejakDana", "Kota Medan", "transparansi", "jalan", "trotoar", "pembangunan", "open data", "WIA MIA 2026"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary", title: `${SITE.name} — ${SITE.tagline}`, description: SITE.description },
}

export const viewport: Viewport = {
  themeColor: "#0b2545",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="absolute -top-16 left-2 z-50 rounded-lg bg-card px-4 py-2 font-semibold text-navy shadow focus:top-2"
        >
          Lewati ke konten utama
        </a>
        <DisclaimerBar />
        <Navbar />
        <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

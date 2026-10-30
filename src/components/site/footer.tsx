import Link from "next/link"

import { NAV_LINKS, SITE } from "@/lib/site"

export function Footer() {
  return (
    <footer className="mt-auto bg-navy py-8 text-sm text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <p>
            <strong className="text-white">{SITE.name}</strong> — {SITE.tagline}.
          </p>
          <p>
            Situs independen untuk kompetisi Web In Action (WIA) MIA 2026, bukan situs resmi pemerintah. Informasi
            mengikuti publikasi sumber pada tanggalnya dan dapat berubah.
          </p>
        </div>
        <nav aria-label="Navigasi footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-slate-200 underline-offset-4 hover:underline sm:min-h-0">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/site"

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-[linear-gradient(135deg,var(--navy)_0%,var(--navy-soft)_55%,var(--primary)_100%)] py-14 text-white md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-3 text-xs font-bold tracking-[0.08em] text-blue-200 uppercase">
          Studi kasus Kota Medan · Jalan &amp; Trotoar
        </p>
        <h1 id="hero-title" className="text-[clamp(1.9rem,6vw,3rem)] leading-tight font-bold tracking-tight text-white">
          {SITE.tagline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-200">
          Cari kegiatan pembangunan jalan dan trotoar yang disebut dalam publikasi resmi, pahami apa yang sudah dan{" "}
          <em>belum</em> diketahui, lalu telusuri langsung ke sumber aslinya.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 bg-white px-5 text-base font-semibold text-navy hover:bg-blue-50">
            <Link href="/proyek">
              Jelajahi kegiatan <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-white/50 bg-white/10 px-5 text-base font-semibold text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/#metodologi">Cara kami mengumpulkan data</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

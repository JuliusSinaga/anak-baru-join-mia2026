import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CoverageStats } from "@/components/home/coverage-stats"
import { Hero } from "@/components/home/hero"
import { Methodology } from "@/components/home/methodology"
import { Mission } from "@/components/home/mission"
import { computeCoverage } from "@/lib/format"
import { getAllProjects } from "@/lib/projects"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function HomePage() {
  const coverage = computeCoverage(getAllProjects())

  return (
    <>
      <Hero />
      <CoverageStats coverage={coverage} />
      <Mission />
      <section aria-labelledby="cta-title" className="py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cta-title" className="text-2xl font-bold">
              Telusuri {coverage.total} kegiatan
            </h2>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Setiap entri adalah kegiatan yang disebut dalam publikasi resmi, bukan paket pengadaan yang sudah
              dicocokkan dengan SiRUP. Status adalah yang dilaporkan sumber pada tanggal publikasi.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-5 text-base font-semibold">
            <Link href="/proyek">
              Buka katalog <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
      <Methodology latestAsOf={coverage.latestAsOf} />
    </>
  )
}

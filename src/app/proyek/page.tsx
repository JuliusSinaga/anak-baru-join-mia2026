import type { Metadata } from "next"
import { Suspense } from "react"
import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CatalogSkeleton } from "@/components/project/catalog-skeleton"
import { ProjectCatalog } from "@/components/project/project-catalog"
import { getAllProjects } from "@/lib/projects"

export const metadata: Metadata = {
  title: "Katalog kegiatan",
  description:
    "Cari dan saring kegiatan pembangunan jalan dan trotoar Kota Medan menurut nama jalan, wilayah, kategori, dan status yang dilaporkan sumber resmi.",
  alternates: { canonical: "/proyek" },
}

export default function CatalogPage() {
  const projects = getAllProjects()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-bold">Katalog kegiatan pembangunan</h1>
      <p className="mt-1 text-muted-foreground">Kota Medan · Jalan &amp; Trotoar</p>

      <Alert className="mt-5 border-blue-100 border-l-4 border-l-primary bg-secondary text-navy" role="note">
        <InfoIcon />
        <AlertDescription className="text-navy">
          <p>
            Setiap entri adalah <strong>kegiatan yang disebut dalam publikasi resmi</strong>, bukan paket pengadaan
            yang sudah dicocokkan dengan SiRUP. Status adalah yang <strong>dilaporkan sumber pada tanggal publikasi</strong>,
            bukan kondisi real-time.
          </p>
        </AlertDescription>
      </Alert>

      <div className="mt-5">
        {/* useSearchParams di ProjectCatalog butuh Suspense; fallback = loading state */}
        <Suspense fallback={<CatalogSkeleton count={projects.length} />}>
          <ProjectCatalog projects={projects} />
        </Suspense>
      </div>
    </div>
  )
}

import { ExternalLinkIcon, InfoIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CategoryBadge, StatusBadge } from "@/components/project/badges"
import {
  DATA_KIND_LABEL,
  formatDate,
  formatValue,
  reportedStatusLine,
  safeHttpsUrl,
  STATUS_DESCRIPTIONS,
  UNVERIFIED_FIELDS,
  VERIFICATION_LABEL,
} from "@/lib/format"
import type { Project } from "@/lib/project-types"
import { SITE } from "@/lib/site"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t py-5 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Facts({ rows, testIdPrefix }: { rows: { key: string; label: string; value: string; missing?: boolean }[]; testIdPrefix?: string }) {
  return (
    <dl className="divide-y divide-border/70">
      {rows.map((row) => (
        <div
          key={row.key}
          data-field={testIdPrefix ? row.key : undefined}
          className="grid gap-0.5 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-3"
        >
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className={row.missing ? "font-semibold text-warn-foreground italic" : "font-semibold"}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SourceLink({ url }: { url: string }) {
  const href = safeHttpsUrl(url)
  if (!href) {
    return (
      <Alert className="border-warn-border bg-warn text-warn-foreground">
        <TriangleAlertIcon />
        <AlertDescription className="text-warn-foreground">
          Tautan sumber tidak tersedia atau tidak valid. Entri ini belum dapat ditelusuri.
        </AlertDescription>
      </Alert>
    )
  }
  return (
    <div className="grid justify-items-start gap-2">
      <Button asChild className="h-11 px-5 text-sm font-semibold">
        <a href={href} target="_blank" rel="noopener noreferrer" data-source-link>
          Buka sumber asli
          <span className="sr-only"> (membuka tab baru)</span>
          <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
        </a>
      </Button>
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-navy-soft">{new URL(href).hostname}</span>
        <br />
        <code className="break-all">{href}</code>
      </p>
    </div>
  )
}

export function ProjectDetail({ project }: { project: Project }) {
  const info = [
    { key: "category", label: "Kategori", value: project.category },
    { key: "location", label: "Lokasi", value: project.location },
    { key: "agency", label: "Instansi (menurut sumber)", value: project.agency },
    { key: "fiscal_year", label: "Tahun", value: String(project.fiscal_year) },
    {
      key: "length_km",
      label: "Panjang (menurut sumber)",
      value: formatValue(project.length_km, "km") ?? "Tidak disebutkan sumber",
    },
    { key: "data_kind", label: "Jenis data", value: DATA_KIND_LABEL },
  ]
  const unverified = UNVERIFIED_FIELDS.map((f) => {
    const value = formatValue(project[f.key], f.format)
    return { key: f.key, label: f.label, value: value ?? f.missing, missing: value === null }
  })
  const provenance = [
    { key: "source_published_at", label: "Tanggal publikasi sumber", value: formatDate(project.source_published_at) ?? "Tidak tercantum" },
    { key: "as_of", label: "Data dikurasi JejakDana per", value: formatDate(project.as_of) ?? "Tidak tercantum" },
    { key: "verification_level", label: "Tingkat verifikasi", value: VERIFICATION_LABEL },
  ]

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap gap-1.5">
        <CategoryBadge category={project.category} />
        <StatusBadge status={project.reported_status} />
      </div>

      <Section title="Status yang dilaporkan">
        <p className="font-semibold" data-testid="status-line">
          {reportedStatusLine(project)}
        </p>
        <p className="text-muted-foreground">{STATUS_DESCRIPTIONS[project.reported_status]}</p>
        <p className="text-muted-foreground">Status bukan pemantauan real-time dan dapat berbeda dengan kondisi saat ini.</p>
      </Section>

      <Section title="Ringkasan dari sumber">
        <p>{project.summary}</p>
      </Section>

      <Section title="Informasi kegiatan">
        <Facts rows={info} />
      </Section>

      <Section title="Data anggaran & progres">
        <p className="text-muted-foreground">
          Publikasi berita tidak membuktikan pagu, nilai kontrak, atau progres fisik. Kolom di bawah hanya diisi bila
          ada dokumen primer yang cocok.
        </p>
        <Facts rows={unverified} testIdPrefix="field" />
      </Section>

      <Section title="Sumber & asal data">
        <SourceLink url={project.source_url} />
        <Facts rows={provenance} />
        <p className="text-sm text-muted-foreground">
          “{VERIFICATION_LABEL}” berarti informasi berasal dari publikasi resmi, bukan inspeksi fisik independen oleh
          JejakDana.
        </p>
      </Section>

      <Section title="Keterbatasan data">
        <Alert className="border-warn-border bg-warn text-warn-foreground">
          <TriangleAlertIcon />
          <AlertDescription className="text-warn-foreground">{project.warning}</AlertDescription>
        </Alert>
      </Section>

      <Alert className="mt-2 border-blue-100 bg-secondary text-navy">
        <InfoIcon />
        <AlertTitle>Situs independen</AlertTitle>
        <AlertDescription className="text-navy-soft">{SITE.disclaimer}</AlertDescription>
      </Alert>
    </div>
  )
}

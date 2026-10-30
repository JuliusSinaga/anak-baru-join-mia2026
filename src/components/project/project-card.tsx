import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CategoryBadge, StatusBadge } from "@/components/project/badges"
import { formatDate, formatValue, VERIFICATION_LABEL } from "@/lib/format"
import type { Project } from "@/lib/project-types"

export function ProjectCard({ project }: { project: Project }) {
  const titleId = `card-title-${project.id}`
  const meta = [
    ["Lokasi", project.location],
    ["Instansi", project.agency],
    ["Tanggal sumber", formatDate(project.source_published_at) ?? "Tidak tercantum"],
  ] as const

  return (
    <li data-testid="project-card" data-id={project.id}>
      <article
        aria-labelledby={titleId}
        className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-sm"
      >
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={project.category} />
          <StatusBadge status={project.reported_status} />
        </div>
        <h2 id={titleId} className="text-lg leading-snug font-semibold">
          {project.name}
        </h2>
        <dl className="grid gap-1 text-sm">
          {meta.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">{project.summary}</p>
        <p className="text-sm" data-card-budget>
          Pagu anggaran:{" "}
          <strong className="font-semibold text-warn-foreground italic">
            {formatValue(project.budget_ceiling_idr, "idr") ?? "Belum terverifikasi"}
          </strong>
        </p>
        <p className="text-xs text-muted-foreground">{VERIFICATION_LABEL}</p>
        <div className="mt-auto pt-1">
          <Button asChild className="h-11 w-full text-sm font-semibold">
            <Link href={`/proyek/${project.id}`} aria-label={`Lihat detail dan sumber: ${project.name}`}>
              Lihat detail &amp; sumber
            </Link>
          </Button>
        </div>
      </article>
    </li>
  )
}

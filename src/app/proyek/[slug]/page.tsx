import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { ProjectDetail } from "@/components/project/project-detail"
import { ProjectReports } from "@/components/project/project-reports"
import { statusLabel } from "@/lib/format"
import { getAllProjects, getProjectBySlug } from "@/lib/projects"

type Params = { slug: string }

// Semua halaman detail dibuat statis saat build; slug lain langsung 404.
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return getAllProjects().map((p) => ({ slug: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug)
  if (!project) return {}
  const description = `${project.category} · ${project.location} · ${statusLabel(project.reported_status)} menurut sumber. ${project.summary}`
  return {
    title: project.name,
    description,
    alternates: { canonical: `/proyek/${project.id}` },
    openGraph: { type: "article", title: project.name, description },
  }
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const project = getProjectBySlug((await params).slug)
  if (!project) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm">
        <ol className="flex flex-wrap gap-1 text-muted-foreground">
          <li>
            <Link href="/" className="text-primary underline-offset-4 hover:underline">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/proyek" className="text-primary underline-offset-4 hover:underline">
              Katalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{project.name}</li>
        </ol>
      </nav>
      <h1 className="mb-5 text-[clamp(1.6rem,4vw,2.2rem)] leading-tight font-bold">{project.name}</h1>
      <ProjectDetail project={project} />
      <ProjectReports projectId={project.id} />
      <p className="mt-6">
        <Link href="/proyek" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline">
          <ArrowLeftIcon aria-hidden="true" className="size-4" /> Kembali ke katalog
        </Link>
      </p>
    </div>
  )
}

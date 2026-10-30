"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { EmptyState } from "@/components/project/empty-state"
import { ProjectCard } from "@/components/project/project-card"
import { ProjectFilter } from "@/components/project/project-filter"
import { filterProjects, STATUS_LABELS, type ProjectFilters } from "@/lib/format"
import type { Project } from "@/lib/project-types"

const EMPTY: ProjectFilters = { query: "", category: "", status: "" }
const STATUS_ORDER = Object.keys(STATUS_LABELS)

export function ProjectCatalog({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams()
  const categories = useMemo(
    () => [...new Set(projects.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "id")),
    [projects],
  )
  const statuses = useMemo(
    () => [...new Set(projects.map((p) => p.reported_status))].sort((a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)),
    [projects],
  )

  // Nilai awal dari URL (?q=&kategori=&status=); nilai yang tidak dikenal diabaikan.
  const [filters, setFilters] = useState<ProjectFilters>(() => {
    const category = searchParams.get("kategori") ?? ""
    const status = searchParams.get("status") ?? ""
    return {
      query: searchParams.get("q") ?? "",
      category: categories.includes(category as Project["category"]) ? category : "",
      status: statuses.includes(status as Project["reported_status"]) ? status : "",
    }
  })

  // Sinkronkan filter ke URL agar bisa dibagikan, tanpa navigasi ulang.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.query.trim()) params.set("q", filters.query.trim())
    if (filters.category) params.set("kategori", filters.category)
    if (filters.status) params.set("status", filters.status)
    const search = params.toString()
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", url)
    }
  }, [filters])

  const results = useMemo(() => filterProjects(projects, filters), [projects, filters])
  const active = Boolean(filters.query.trim() || filters.category || filters.status)
  const searchInput = useRef<HTMLDivElement>(null)

  function reset() {
    setFilters(EMPTY)
    searchInput.current?.querySelector("input")?.focus()
  }

  return (
    <div className="grid gap-4">
      <div ref={searchInput}>
        <ProjectFilter value={filters} categories={categories} statuses={statuses} onChange={setFilters} onReset={reset} />
      </div>

      <p role="status" aria-live="polite" data-testid="result-count" className="font-semibold text-navy-soft">
        {active
          ? `Menampilkan ${results.length} dari ${projects.length} kegiatan`
          : `Menampilkan semua ${projects.length} kegiatan`}
      </p>

      {results.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <ul aria-label="Daftar kegiatan" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </ul>
      )}
    </div>
  )
}

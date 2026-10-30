import "server-only"

import rawProjects from "../../data/projects.json"
import { parseProjects } from "./parse-projects"
import type { Project } from "./project-types"

// Divalidasi sekali saat modul dimuat (saat build); data rusak menggagalkan build, bukan tampil diam-diam.
const projects: Project[] = parseProjects(rawProjects)

export function getAllProjects(): Project[] {
  return projects
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.id === slug)
}

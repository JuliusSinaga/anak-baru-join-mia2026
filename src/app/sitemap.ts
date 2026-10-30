import type { MetadataRoute } from "next"

import { getAllProjects } from "@/lib/projects"
import { siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const projects = getAllProjects()
  const latest = projects.map((p) => p.as_of).sort().at(-1)
  return [
    { url: `${base}/`, lastModified: latest, priority: 1 },
    { url: `${base}/proyek`, lastModified: latest, priority: 0.9 },
    ...projects.map((p) => ({ url: `${base}/proyek/${p.id}`, lastModified: p.as_of, priority: 0.7 })),
  ]
}

// Label, format, dan filter yang aman dipakai di server maupun klien.
// Prinsip: data kosong tampil sebagai "belum tersedia", tidak pernah 0 atau estimasi.
import type { Project, ReportedStatus } from "./project-types"

export const STATUS_LABELS: Record<ReportedStatus, string> = {
  pelaksanaan_dilaporkan: "Pelaksanaan dilaporkan",
  selesai_menurut_sumber: "Selesai menurut sumber",
  perbaikan_titik_dilaporkan: "Perbaikan titik dilaporkan",
}

export const STATUS_DESCRIPTIONS: Record<ReportedStatus, string> = {
  pelaksanaan_dilaporkan: "Sumber melaporkan pekerjaan sedang dilaksanakan pada tanggal publikasi.",
  selesai_menurut_sumber:
    "Sumber menyatakan pekerjaan selesai pada tanggal publikasi. Bukan hasil inspeksi lapangan JejakDana.",
  perbaikan_titik_dilaporkan: "Sumber melaporkan perbaikan pada titik tertentu, bukan seluruh ruas.",
}

export const DATA_KIND_LABEL = "Kegiatan dari publikasi resmi (bukan paket pengadaan tervalidasi)"
export const VERIFICATION_LABEL = "Sumber: publikasi pemerintah"

export type UnverifiedField = {
  key: "budget_ceiling_idr" | "contract_value_idr" | "physical_progress_percent" | "rup_id"
  label: string
  missing: string
  format: "idr" | "percent" | "text"
}

export const UNVERIFIED_FIELDS: UnverifiedField[] = [
  { key: "budget_ceiling_idr", label: "Pagu anggaran", missing: "Belum terverifikasi", format: "idr" },
  { key: "contract_value_idr", label: "Nilai kontrak", missing: "Belum terverifikasi", format: "idr" },
  { key: "physical_progress_percent", label: "Progres fisik", missing: "Belum tersedia", format: "percent" },
  { key: "rup_id", label: "Kode RUP (SiRUP)", missing: "Belum terverifikasi", format: "text" },
]

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as ReportedStatus] ?? `Status tidak dikenal (${status || "kosong"})`
}

/** Lowercase + hapus diakritik agar pencarian tidak peka huruf besar/kecil maupun aksen. */
export function fold(text: unknown): string {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export type ProjectFilters = { query: string; category: string; status: string }

export function filterProjects(projects: Project[], { query, category, status }: ProjectFilters): Project[] {
  const terms = fold(query).split(" ").filter(Boolean)
  return projects.filter((p) => {
    if (category && p.category !== category) return false
    if (status && p.reported_status !== status) return false
    const haystack = fold([p.name, p.location, p.category, p.agency, p.summary].join(" "))
    return terms.every((t) => haystack.includes(t))
  })
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** Format YYYY-MM-DD tanpa pergeseran zona waktu; null bila tidak valid. */
export function formatDate(value: unknown): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""))
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== m[0]) return null
  return dateFormatter.format(d)
}

export function formatValue(value: unknown, format: "idr" | "percent" | "km" | "text"): string | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") {
    if (format === "idr")
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
    if (format === "percent") return `${value.toLocaleString("id-ID")}%`
    if (format === "km") return `${value.toLocaleString("id-ID")} km`
  }
  return String(value)
}

/** Hanya URL https yang boleh menjadi tautan. */
export function safeHttpsUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value))
    return url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

export function reportedStatusLine(project: Project): string {
  const date = formatDate(project.source_published_at)
  return `${statusLabel(project.reported_status)} — ${
    date ? `berdasarkan publikasi ${date}` : "tanggal publikasi sumber tidak tercantum"
  }`
}

export type Coverage = {
  total: number
  byCategory: { category: string; count: number }[]
  withSource: number
  withBudget: number
  firstSourceDate: string | null
  lastSourceDate: string | null
  latestAsOf: string | null
}

/** Ringkasan cakupan yang dihitung dari dataset (tidak ada angka hardcoded). */
export function computeCoverage(projects: Project[]): Coverage {
  const counts = new Map<string, number>()
  for (const p of projects) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  const dates = projects.map((p) => p.source_published_at).filter((d) => formatDate(d)).sort()
  const asOf = projects.map((p) => p.as_of).filter((d) => formatDate(d)).sort()
  return {
    total: projects.length,
    byCategory: [...counts].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    withSource: projects.filter((p) => safeHttpsUrl(p.source_url)).length,
    withBudget: projects.filter((p) => p.budget_ceiling_idr !== null).length,
    firstSourceDate: dates[0] ?? null,
    lastSourceDate: dates.at(-1) ?? null,
    latestAsOf: asOf.at(-1) ?? null,
  }
}

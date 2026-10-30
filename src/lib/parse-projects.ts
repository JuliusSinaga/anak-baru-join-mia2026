import { CATEGORIES, REPORTED_STATUSES, type Project } from "./project-types"

const DATE = /^\d{4}-\d{2}-\d{2}$/
const NULL_UNTIL_PRIMARY = ["budget_ceiling_idr", "contract_value_idr", "physical_progress_percent", "rup_id"] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * Memvalidasi bentuk dataset dan aturan integritas minimum. Pemeriksaan lengkap
 * (domain sumber, urutan tanggal, dll.) ada di scripts/validate-data.mjs yang dijalankan sebelum build.
 */
export function parseProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) throw new Error("projects.json harus berupa array kegiatan")
  const ids = new Set<string>()
  return raw.map((item, i) => {
    const fail = (message: string): never => {
      throw new Error(`projects.json [${i}] ${isRecord(item) ? String(item.id) : ""}: ${message}`)
    }
    if (!isRecord(item)) return fail("entri bukan objek")
    for (const key of ["id", "name", "location", "agency", "summary", "source_url", "warning"] as const) {
      if (!isNonEmptyString(item[key])) fail(`${key} wajib string tidak kosong`)
    }
    if (ids.has(item.id as string)) fail("id duplikat")
    ids.add(item.id as string)
    if (!/^[a-z0-9-]+$/.test(item.id as string)) fail("id harus slug (huruf kecil, angka, tanda hubung)")
    if (!(CATEGORIES as readonly unknown[]).includes(item.category)) fail("category tidak dikenal")
    if (!(REPORTED_STATUSES as readonly unknown[]).includes(item.reported_status)) fail("reported_status tidak dikenal")
    for (const key of ["source_published_at", "as_of"] as const) {
      if (typeof item[key] !== "string" || !DATE.test(item[key] as string)) fail(`${key} harus YYYY-MM-DD`)
    }
    if (!Number.isInteger(item.fiscal_year)) fail("fiscal_year wajib integer")
    if (item.length_km !== null && typeof item.length_km !== "number") fail("length_km harus null atau angka")
    for (const key of NULL_UNTIL_PRIMARY) {
      if (!(key in item)) fail(`${key} wajib ada (null bila belum terverifikasi)`)
      if (item[key] === 0 || item[key] === "") fail(`${key} tidak boleh 0/kosong; gunakan null`)
    }
    if (item.data_kind !== "official_news_activity") fail("data_kind tidak dikenal")
    if (item.verification_level !== "official_publication") fail("verification_level tidak dikenal")
    return item as unknown as Project
  })
}

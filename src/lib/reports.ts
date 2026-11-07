// Tipe dan validasi laporan warga. Aman dipakai di server maupun klien.
import { formatDate } from "./format"

export const REPORT_MIN = 20
export const REPORT_MAX = 1000

export type ReportInput = { project_id: string; body: string; observed_on: string | null }
export type PublicReport = { id: string; body: string; observed_on: string | null; created_at: string }

type Result = { ok: true; value: ReportInput } | { ok: false; error: string }

/** Tanggal hari ini (YYYY-MM-DD) menurut WIB, supaya tanggal "hari ini" warga tidak ditolak sebagai masa depan. */
export function todayWib(now = Date.now()): string {
  return new Date(now + 7 * 3_600_000).toISOString().slice(0, 10)
}

export function validateReport(raw: unknown, knownIds: ReadonlySet<string>, today: string): Result {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, error: "Data laporan tidak valid." }
  const { project_id, body, observed_on } = raw as Record<string, unknown>

  if (typeof project_id !== "string" || !knownIds.has(project_id)) return { ok: false, error: "Kegiatan tidak dikenal." }

  const text = typeof body === "string" ? body.trim() : ""
  if (text.length < REPORT_MIN) return { ok: false, error: `Isi laporan minimal ${REPORT_MIN} karakter.` }
  if (text.length > REPORT_MAX) return { ok: false, error: `Isi laporan maksimal ${REPORT_MAX} karakter.` }

  let observed: string | null = null
  if (observed_on !== undefined && observed_on !== null && observed_on !== "") {
    if (typeof observed_on !== "string" || !formatDate(observed_on)) return { ok: false, error: "Tanggal pengamatan tidak valid." }
    if (observed_on > today) return { ok: false, error: "Tanggal pengamatan tidak boleh di masa depan." }
    observed = observed_on
  }
  return { ok: true, value: { project_id, body: text, observed_on: observed } }
}

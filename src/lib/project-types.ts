export const CATEGORIES = ["Jalan", "Trotoar"] as const
export type Category = (typeof CATEGORIES)[number]

export const REPORTED_STATUSES = [
  "pelaksanaan_dilaporkan",
  "selesai_menurut_sumber",
  "perbaikan_titik_dilaporkan",
] as const
export type ReportedStatus = (typeof REPORTED_STATUSES)[number]

/** Model data kanonis (PRD §8). Field anggaran/progres/RUP null sampai ada dokumen primer. */
export type Project = {
  id: string
  name: string
  category: Category
  location: string
  agency: string
  reported_status: ReportedStatus
  source_published_at: string
  summary: string
  source_url: string
  fiscal_year: number
  length_km: number | null
  budget_ceiling_idr: number | null
  contract_value_idr: number | null
  physical_progress_percent: number | null
  rup_id: string | null
  data_kind: "official_news_activity"
  verification_level: "official_publication"
  as_of: string
  warning: string
}

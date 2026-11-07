import "server-only"

import { createHmac } from "node:crypto"

import type { PublicReport, ReportInput } from "./reports"

// Akses Supabase (PostgREST) hanya dari server dengan service_role; kunci ini tidak boleh berawalan NEXT_PUBLIC_.
function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "")
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? { url: `${url}/rest/v1/reports`, key } : null
}

export function reportsEnabled(): boolean {
  return config() !== null
}

function headers(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}` }
}

export function hashIp(ip: string): string | null {
  const c = config()
  return c ? createHmac("sha256", c.key).update(ip).digest("hex") : null
}

/** Laporan yang sudah disetujui moderator; null bila tidak dapat dimuat (UI menampilkan pesan, bukan daftar kosong). */
export async function listApprovedReports(projectId: string): Promise<PublicReport[] | null> {
  const c = config()
  if (!c) return null
  const query = `select=id,body,observed_on,created_at&project_id=eq.${encodeURIComponent(projectId)}&status=eq.approved&order=created_at.desc&limit=20`
  try {
    const res = await fetch(`${c.url}?${query}`, { headers: headers(c.key), next: { revalidate: 60 } })
    return res.ok ? ((await res.json()) as PublicReport[]) : null
  } catch {
    return null
  }
}

/** Jumlah laporan dari IP (ter-hash) sejak waktu tertentu, maksimal `cap`; null bila gagal. */
export async function countRecentReports(ipHash: string, sinceIso: string, cap: number): Promise<number | null> {
  const c = config()
  if (!c) return null
  const query = `select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(sinceIso)}&limit=${cap}`
  try {
    const res = await fetch(`${c.url}?${query}`, { headers: headers(c.key), cache: "no-store" })
    return res.ok ? ((await res.json()) as unknown[]).length : null
  } catch {
    return null
  }
}

export async function insertReport(input: ReportInput, ipHash: string): Promise<boolean> {
  const c = config()
  if (!c) return false
  try {
    const res = await fetch(c.url, {
      method: "POST",
      headers: { ...headers(c.key), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ...input, ip_hash: ipHash }),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

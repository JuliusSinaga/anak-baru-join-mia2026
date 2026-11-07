import { NextResponse } from "next/server"

import { getAllProjects } from "@/lib/projects"
import { validateReport, todayWib } from "@/lib/reports"
import { countRecentReports, hashIp, insertReport, reportsEnabled } from "@/lib/reports-store"

const MAX_BODY_BYTES = 5_000
const LIMIT_PER_HOUR = 3

function reply(status: number, error?: string) {
  return NextResponse.json(error ? { ok: false, error } : { ok: true }, { status })
}

export async function POST(request: Request) {
  if (!reportsEnabled()) return reply(503, "Fitur laporan belum diaktifkan.")

  // Hanya dari halaman situs ini: Origin harus sama dengan Host.
  try {
    if (new URL(request.headers.get("origin") ?? "").host !== request.headers.get("host")) return reply(403, "Permintaan ditolak.")
  } catch {
    return reply(403, "Permintaan ditolak.")
  }

  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return reply(413, "Laporan terlalu besar.")
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return reply(400, "Data laporan tidak valid.")
  }

  // Honeypot: kolom tersembunyi yang hanya diisi bot. Pura-pura berhasil tanpa menyimpan.
  const trap = (raw as Record<string, unknown> | null)?.website
  if (typeof trap === "string" && trap.trim()) return reply(200)

  const checked = validateReport(raw, new Set(getAllProjects().map((p) => p.id)), todayWib())
  if (!checked.ok) return reply(422, checked.error)

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
  const ipHash = hashIp(ip)
  if (!ipHash) return reply(503, "Fitur laporan belum diaktifkan.")

  const recent = await countRecentReports(ipHash, new Date(Date.now() - 3_600_000).toISOString(), LIMIT_PER_HOUR)
  if (recent === null) return reply(502, "Laporan belum dapat diproses. Coba lagi nanti.")
  if (recent >= LIMIT_PER_HOUR) return reply(429, "Terlalu banyak laporan dari jaringan Anda. Coba lagi dalam satu jam.")

  if (!(await insertReport(checked.value, ipHash))) return reply(502, "Laporan belum dapat disimpan. Coba lagi nanti.")
  return reply(201)
}

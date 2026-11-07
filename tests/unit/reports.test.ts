import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { POST } from "@/app/api/laporan/route"
import { todayWib, validateReport } from "@/lib/reports"

const known = new Set(["juanda", "takenaka"])
const today = "2026-11-07"
const good = { project_id: "juanda", body: "Trotoar sudah selesai dipasang, drainase masih terbuka.", observed_on: "2026-11-05" }

describe("validateReport", () => {
  it("menerima laporan valid dan memangkas spasi", () => {
    const r = validateReport({ ...good, body: `  ${good.body}  ` }, known, today)
    expect(r).toEqual({ ok: true, value: good })
  })

  it("tanggal opsional → null; hari ini diterima, masa depan dan tanggal mustahil ditolak", () => {
    expect(validateReport({ ...good, observed_on: "" }, known, today)).toMatchObject({ ok: true, value: { observed_on: null } })
    expect(validateReport({ ...good, observed_on: today }, known, today).ok).toBe(true)
    expect(validateReport({ ...good, observed_on: "2026-11-08" }, known, today).ok).toBe(false)
    expect(validateReport({ ...good, observed_on: "2026-02-30" }, known, today).ok).toBe(false)
  })

  it("menolak kegiatan asing, isi terlalu pendek/panjang, dan bentuk data salah", () => {
    expect(validateReport({ ...good, project_id: "tidak-ada" }, known, today).ok).toBe(false)
    expect(validateReport({ ...good, body: "terlalu pendek" }, known, today).ok).toBe(false)
    expect(validateReport({ ...good, body: " ".repeat(40) }, known, today).ok).toBe(false)
    expect(validateReport({ ...good, body: "x".repeat(1001) }, known, today).ok).toBe(false)
    expect(validateReport(null, known, today).ok).toBe(false)
    expect(validateReport([good], known, today).ok).toBe(false)
  })

  it("todayWib memakai tanggal WIB (UTC+7)", () => {
    expect(todayWib(Date.UTC(2026, 10, 6, 20, 0))).toBe("2026-11-07")
  })
})

describe("POST /api/laporan", () => {
  const fetchMock = vi.fn()
  let existing = 0
  let insertOk = true

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    POST(
      new Request("https://jejakdana.test/api/laporan", {
        method: "POST",
        body: typeof body === "string" ? body : JSON.stringify(body),
        headers: { origin: "https://jejakdana.test", host: "jejakdana.test", "x-forwarded-for": "203.0.113.9, 10.0.0.1", ...headers },
      }),
    )

  beforeEach(() => {
    existing = 0
    insertOk = true
    fetchMock.mockReset()
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? new Response(null, { status: insertOk ? 201 : 500 })
        : Response.json(Array.from({ length: existing }, (_, i) => ({ id: String(i) }))),
    )
    vi.stubGlobal("fetch", fetchMock)
    vi.stubEnv("SUPABASE_URL", "https://abc.supabase.co/")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("503 bila Supabase belum dikonfigurasi", async () => {
    vi.stubEnv("SUPABASE_URL", "")
    const res = await post(good)
    expect(res.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("403 bila Origin tidak sama dengan Host atau tidak ada", async () => {
    expect((await post(good, { origin: "https://situs-lain.test" })).status).toBe(403)
    expect((await post(good, { origin: "" })).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("400/413/422 untuk JSON rusak, badan terlalu besar, dan isi tidak valid", async () => {
    expect((await post("{bukan json")).status).toBe(400)
    expect((await post("x".repeat(6000))).status).toBe(413)
    expect((await post({ ...good, body: "pendek" })).status).toBe(422)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("honeypot terisi: dijawab sukses tetapi tidak disimpan", async () => {
    const res = await post({ ...good, website: "http://spam.test" })
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("201: laporan disimpan dengan IP ter-hash (bukan IP asli) memakai service key", async () => {
    const res = await post(good)
    expect(res.status).toBe(201)
    const [, init] = fetchMock.mock.calls.find(([, i]) => i?.method === "POST")!
    const stored = JSON.parse(init.body as string)
    expect(stored).toMatchObject(good)
    expect(stored.ip_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(init.body).not.toContain("203.0.113.9")
    expect(init.headers).toMatchObject({ apikey: "service-key", Authorization: "Bearer service-key" })
    expect(fetchMock.mock.calls[0][0]).toContain("https://abc.supabase.co/rest/v1/reports?")
  })

  it("429 setelah 3 laporan per jam dan tidak menyimpan yang ke-4", async () => {
    existing = 3
    const res = await post(good)
    expect(res.status).toBe(429)
    expect(fetchMock.mock.calls.every(([, i]) => i?.method !== "POST")).toBe(true)
  })

  it("502 bila penyimpanan gagal", async () => {
    insertOk = false
    expect((await post(good)).status).toBe(502)
  })
})

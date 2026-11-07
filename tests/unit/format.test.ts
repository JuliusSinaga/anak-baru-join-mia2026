import { describe, expect, it } from "vitest"

import realData from "../../data/projects.json"
import fixture from "../fixtures/projects.fixture.json"
import {
  computeCoverage,
  filterProjects,
  fold,
  formatDate,
  formatValue,
  reportedStatusLine,
  safeHttpsUrl,
  statusLabel,
  type ProjectFilters,
} from "@/lib/format"
import { parseProjects } from "@/lib/parse-projects"

const projects = parseProjects(realData)
const none: ProjectFilters = { query: "", category: "", status: "", year: "", budget: "" }

describe("parseProjects", () => {
  it("menerima dataset asli dan fixture", () => {
    expect(projects).toHaveLength(6)
    expect(parseProjects(fixture)).toHaveLength(6)
  })

  it("menolak nilai 0 untuk data anggaran yang belum terverifikasi", () => {
    const bad = [{ ...realData[0], budget_ceiling_idr: 0 }]
    expect(() => parseProjects(bad)).toThrow(/budget_ceiling_idr/)
  })

  it("menolak id duplikat, status tak dikenal, dan field hilang", () => {
    expect(() => parseProjects([realData[0], realData[0]])).toThrow(/duplikat/)
    expect(() => parseProjects([{ ...realData[0], reported_status: "selesai" }])).toThrow(/reported_status/)
    const { rup_id: _omit, ...missing } = realData[0]
    expect(() => parseProjects([missing])).toThrow(/rup_id/)
  })
})

describe("filterProjects", () => {
  it("AC-02: 'juanda' (huruf kecil) hanya menemukan Juanda", () => {
    const r = filterProjects(projects, { ...none, query: "juanda" })
    expect(r.map((p) => p.id)).toEqual(["juanda"])
  })

  it("AC-03: kategori Trotoar hanya mengembalikan Trotoar", () => {
    const r = filterProjects(projects, { ...none, category: "Trotoar" })
    expect(r.length).toBe(2)
    expect(r.every((p) => p.category === "Trotoar")).toBe(true)
  })

  it("filter kategori + status + kata kunci bekerja serentak", () => {
    expect(filterProjects(projects, { ...none, status: "selesai_menurut_sumber" })).toHaveLength(2)
    expect(filterProjects(projects, { ...none, category: "Trotoar", status: "selesai_menurut_sumber" })).toHaveLength(0)
    expect(filterProjects(projects, { ...none, query: "medan johor", category: "Jalan" }).map((p) => p.id)).toEqual(["speksi-kanal"])
  })

  it("filter tahun anggaran dan ketersediaan pagu", () => {
    expect(filterProjects(projects, { ...none, year: "2026" })).toHaveLength(6)
    expect(filterProjects(projects, { ...none, year: "2025" })).toHaveLength(0)
    expect(filterProjects(projects, { ...none, budget: "belum" })).toHaveLength(6)
    expect(filterProjects(projects, { ...none, budget: "ada" })).toHaveLength(0)
    const withBudget = projects.map((p, i) => (i === 0 ? { ...p, budget_ceiling_idr: 1_000_000 } : p))
    expect(filterProjects(withBudget, { ...none, budget: "ada" }).map((p) => p.id)).toEqual(["juanda"])
    expect(filterProjects(withBudget, { ...none, budget: "belum" })).toHaveLength(5)
  })

  it("pencarian tidak peka aksen/spasi berlebih", () => {
    expect(fold("  Jálan   JUANDA ")).toBe("jalan juanda")
  })
})

describe("format", () => {
  it("tanggal ditampilkan dalam bahasa Indonesia tanpa pergeseran zona waktu", () => {
    expect(formatDate("2026-10-12")).toBe("12 Oktober 2026")
    expect(formatDate("2026-02-30")).toBeNull()
    expect(formatDate(null)).toBeNull()
  })

  it("AC-05: null tidak pernah menjadi 0 atau Rp0", () => {
    expect(formatValue(null, "idr")).toBeNull()
    expect(formatValue(null, "percent")).toBeNull()
    expect(formatValue(1.48, "km")).toBe("1,48 km")
  })

  it("hanya URL https yang dianggap aman", () => {
    expect(safeHttpsUrl("https://portal.medan.go.id/x")).toBe("https://portal.medan.go.id/x")
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull()
    expect(safeHttpsUrl("http://portal.medan.go.id/x")).toBeNull()
  })

  it("status selalu disertai tanggal publikasi sumber", () => {
    const p = projects.find((x) => x.id === "pimpinan-gurilla")!
    expect(reportedStatusLine(p)).toBe("Selesai menurut sumber — berdasarkan publikasi 29 Juli 2026")
    expect(statusLabel("x")).toMatch(/tidak dikenal/)
  })
})

describe("computeCoverage", () => {
  it("dihitung dari dataset, tanpa total anggaran", () => {
    const c = computeCoverage(projects)
    expect(c).toMatchObject({ total: 6, withSource: 6, withBudget: 0, firstSourceDate: "2026-04-29", lastSourceDate: "2026-10-12", latestAsOf: "2026-10-30" })
    expect(c.byCategory).toEqual([
      { category: "Jalan", count: 4 },
      { category: "Trotoar", count: 2 },
    ])
  })
})

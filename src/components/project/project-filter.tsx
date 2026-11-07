"use client"

import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BUDGET_FILTER_LABELS, statusLabel, type BudgetFilter, type ProjectFilters } from "@/lib/format"

// Radix Select tidak menerima value kosong, jadi "semua" dipetakan ke string kosong pada state filter.
const ALL = "semua"

type Props = {
  value: ProjectFilters
  categories: string[]
  statuses: string[]
  years: string[]
  onChange: (next: ProjectFilters) => void
  onReset: () => void
}

export function ProjectFilter({ value, categories, statuses, years, onChange, onReset }: Props) {
  return (
    <form
      role="search"
      aria-label="Cari dan saring kegiatan"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="grid gap-1.5 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="q" className="font-semibold text-navy">
          Cari kegiatan
        </Label>
        <div className="relative">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            type="search"
            autoComplete="off"
            placeholder="Nama jalan atau wilayah"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            className="h-11 bg-card pl-9 text-base md:text-sm"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-kategori" className="font-semibold text-navy">
          Kategori
        </Label>
        <Select
          value={value.category || ALL}
          onValueChange={(v) => onChange({ ...value, category: v === ALL ? "" : v })}
        >
          <SelectTrigger id="filter-kategori" className="h-11! w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-status" className="font-semibold text-navy">
          Status menurut sumber
        </Label>
        <Select value={value.status || ALL} onValueChange={(v) => onChange({ ...value, status: v === ALL ? "" : v })}>
          <SelectTrigger id="filter-status" className="h-11! w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-tahun" className="font-semibold text-navy">
          Tahun anggaran
        </Label>
        <Select value={value.year || ALL} onValueChange={(v) => onChange({ ...value, year: v === ALL ? "" : v })}>
          <SelectTrigger id="filter-tahun" className="h-11! w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua tahun</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-pagu" className="font-semibold text-navy">
          Data anggaran
        </Label>
        <Select
          value={value.budget || ALL}
          onValueChange={(v) => onChange({ ...value, budget: v === ALL ? "" : (v as BudgetFilter) })}
        >
          <SelectTrigger id="filter-pagu" className="h-11! w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua</SelectItem>
            {(Object.keys(BUDGET_FILTER_LABELS) as (keyof typeof BUDGET_FILTER_LABELS)[]).map((k) => (
              <SelectItem key={k} value={k}>
                {BUDGET_FILTER_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" variant="outline" onClick={onReset} className="h-11 sm:col-span-2 lg:col-span-4 lg:justify-self-end" data-testid="reset-filters">
        Reset filter
      </Button>
    </form>
  )
}

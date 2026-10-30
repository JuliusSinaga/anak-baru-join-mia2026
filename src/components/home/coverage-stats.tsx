import { formatDate, type Coverage } from "@/lib/format"

function Stat({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <li data-stat={id} className="rounded-xl border bg-card p-4 shadow-sm">
      <span className="block text-2xl font-extrabold text-navy">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </li>
  )
}

export function CoverageStats({ coverage }: { coverage: Coverage }) {
  const range =
    coverage.firstSourceDate && coverage.lastSourceDate
      ? `${formatDate(coverage.firstSourceDate)} – ${formatDate(coverage.lastSourceDate)}`
      : "tidak tercantum"
  const asOf = formatDate(coverage.latestAsOf)

  return (
    <section aria-labelledby="coverage-title" className="py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="coverage-title" className="text-2xl font-bold">
          Cakupan data saat ini
        </h2>
        <p data-testid="coverage-note" className="mt-1 text-muted-foreground">
          Dihitung otomatis dari dataset. Rentang tanggal publikasi sumber: {range}.
          {asOf ? ` Data dikurasi per ${asOf}.` : ""}
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat id="total" value={String(coverage.total)} label="kegiatan tercatat" />
          <Stat
            id="category"
            value={coverage.byCategory.map((c) => `${c.count} ${c.category}`).join(" · ") || "—"}
            label="menurut kategori"
          />
          <Stat id="sources" value={`${coverage.withSource}/${coverage.total}`} label="entri memiliki tautan sumber resmi" />
          <Stat id="budget" value={`${coverage.withBudget}/${coverage.total}`} label="entri dengan pagu anggaran terverifikasi" />
        </ul>
      </div>
    </section>
  )
}

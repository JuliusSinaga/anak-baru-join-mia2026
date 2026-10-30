import { Skeleton } from "@/components/ui/skeleton"

/** Loading state katalog (dipakai sebagai fallback Suspense dan loading.tsx). */
export function CatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Memuat data kegiatan">
      <Skeleton className="h-24 w-full rounded-xl lg:h-20" />
      <Skeleton className="h-5 w-56" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-80 w-full rounded-xl" />
          </li>
        ))}
      </ul>
      <span className="sr-only">Memuat data kegiatan…</span>
    </div>
  )
}

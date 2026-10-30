import { SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div data-testid="empty-state" className="rounded-xl border border-dashed bg-card px-5 py-10 text-center">
      <SearchXIcon aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
      <p className="text-lg font-bold text-navy">Tidak ada kegiatan yang cocok</p>
      <p className="mt-1 text-muted-foreground">
        Coba kata kunci lain (misalnya nama jalan), atau hapus filter kategori/status.
      </p>
      <Button type="button" onClick={onReset} className="mt-4 h-11 px-5">
        Reset pencarian &amp; filter
      </Button>
    </div>
  )
}

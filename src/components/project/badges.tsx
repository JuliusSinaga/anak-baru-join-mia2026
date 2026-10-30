import { Badge } from "@/components/ui/badge"
import { statusLabel } from "@/lib/format"
import type { Project } from "@/lib/project-types"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  selesai_menurut_sumber: "border-ok-border bg-ok text-ok-foreground",
  pelaksanaan_dilaporkan: "border-warn-border bg-warn text-warn-foreground",
  perbaikan_titik_dilaporkan: "border-point-border bg-point text-point-foreground",
}

export function StatusBadge({ status }: { status: Project["reported_status"] }) {
  return (
    <Badge variant="outline" data-status={status} className={cn("h-6 px-2.5 font-semibold", STATUS_STYLES[status])}>
      {statusLabel(status)}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: Project["category"] }) {
  return (
    <Badge variant="secondary" data-category={category} className="h-6 border-blue-100 px-2.5 font-semibold">
      {category}
    </Badge>
  )
}

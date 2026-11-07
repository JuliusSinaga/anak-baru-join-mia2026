import { InfoIcon } from "lucide-react"

import { ReportForm } from "@/components/project/report-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate } from "@/lib/format"
import { listApprovedReports, reportsEnabled } from "@/lib/reports-store"

/** Bagian laporan warga; tidak ditampilkan sama sekali bila Supabase belum dikonfigurasi. */
export async function ProjectReports({ projectId }: { projectId: string }) {
  if (!reportsEnabled()) return null
  const reports = await listApprovedReports(projectId)

  return (
    <section aria-labelledby="reports-title" data-testid="reports" className="mt-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <h2 id="reports-title" className="text-xl font-semibold">
        Laporan warga
      </h2>
      <Alert className="mt-3 border-warn-border bg-warn text-warn-foreground" role="note">
        <InfoIcon />
        <AlertDescription className="text-warn-foreground">
          Laporan ditulis warga dan <strong>belum diverifikasi JejakDana</strong>. Isinya bukan data resmi dan tidak mengubah
          status yang dilaporkan sumber. Laporan baru tampil setelah dimoderasi.
        </AlertDescription>
      </Alert>

      {reports === null ? (
        <p className="mt-4 text-muted-foreground">Laporan belum dapat dimuat saat ini.</p>
      ) : reports.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Belum ada laporan yang ditampilkan untuk kegiatan ini.</p>
      ) : (
        <ul aria-label="Laporan warga" className="mt-4 divide-y">
          {reports.map((r) => (
            <li key={r.id} className="py-3">
              <p className="whitespace-pre-line">{r.body}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.observed_on ? `Diamati ${formatDate(r.observed_on)} · ` : ""}
                Dikirim {formatDate(r.created_at.slice(0, 10)) ?? "tanggal tidak tercantum"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 mb-3 text-lg font-semibold">Kirim laporan</h3>
      <ReportForm projectId={projectId} />
    </section>
  )
}

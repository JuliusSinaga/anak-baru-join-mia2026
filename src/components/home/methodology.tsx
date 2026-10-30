import { formatDate, STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/lib/format"
import type { ReportedStatus } from "@/lib/project-types"

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="space-y-3 rounded-xl border bg-card p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </article>
  )
}

export function Methodology({ latestAsOf }: { latestAsOf: string | null }) {
  const asOf = formatDate(latestAsOf)
  return (
    <section id="metodologi" aria-labelledby="method-title" className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="method-title" className="text-2xl font-bold">
          Metodologi &amp; keterbatasan
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Block title="Asal data">
            <p>
              Entri dikurasi dari publikasi resmi Pemerintah Kota Medan (<code>portal.medan.go.id</code>) dan Dinas
              SDABMBK (<code>sdabmbk.medan.go.id</code>). Setiap entri menyimpan tautan sumber, tanggal publikasi, dan
              tanggal kurasi.
            </p>
            {asOf && <p className="text-muted-foreground">Tanggal kurasi terbaru pada dataset: {asOf}.</p>}
          </Block>
          <Block title="Apa arti status">
            <ul className="grid list-disc gap-2 pl-5">
              {(Object.keys(STATUS_LABELS) as ReportedStatus[]).map((key) => (
                <li key={key}>
                  <strong>{STATUS_LABELS[key]}:</strong> {STATUS_DESCRIPTIONS[key]}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Yang belum kami ketahui">
            <p>
              Publikasi berita tidak membuktikan nomor paket, pagu, nilai kontrak, atau progres fisik. Kolom tersebut
              ditampilkan sebagai <strong>Belum terverifikasi</strong> atau <strong>Belum tersedia</strong> sampai ada
              dokumen pengadaan resmi yang cocok (nama, lokasi, instansi, tahun, dan kode paket).
            </p>
            <p>
              Rencana APBD, realisasi APBD, pagu RUP, nilai kontrak, dan progres fisik adalah hal yang berbeda. Satu
              publikasi yang menyebut dua ruas jalan tidak berarti satu kontrak.
            </p>
          </Block>
          <Block title="Independensi">
            <p>
              JejakDana adalah proyek independen untuk kompetisi Web In Action (WIA) MIA 2026. Kami tidak berafiliasi
              dengan Pemerintah Kota Medan, bukan kanal pengaduan resmi, dan tidak menuduh penyimpangan apa pun.
            </p>
          </Block>
        </div>
      </div>
    </section>
  )
}

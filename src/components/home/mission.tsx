const STEPS = [
  ["Cari", "kegiatan menurut nama jalan, wilayah, atau kategori."],
  ["Pahami", "status yang dilaporkan sumber dan tanggalnya."],
  ["Telusuri", "tautan publikasi resmi aslinya."],
  ["Kenali celah", "data: pagu, kontrak, progres, dan kode RUP yang belum terverifikasi."],
] as const

export function Mission() {
  return (
    <section aria-labelledby="mission-title" className="border-y bg-card py-12">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
        <div>
          <h2 id="mission-title" className="text-2xl font-bold">
            Misi JejakDana
          </h2>
          <p className="mt-2">
            Informasi rencana pengadaan, kegiatan, dan kondisi fisik pembangunan tersebar di banyak tempat. JejakDana
            menyatukan kegiatan yang disebut publikasi resmi ke satu katalog yang mudah dicari, tanpa menambahkan angka
            yang tidak didukung bukti.
          </p>
        </div>
        <ol className="grid list-decimal gap-2.5 pl-5">
          {STEPS.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong> {text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

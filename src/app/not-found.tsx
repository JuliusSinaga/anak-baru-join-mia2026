import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm font-bold tracking-wider text-muted-foreground uppercase">404</p>
      <h1 className="mt-2 text-3xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-muted-foreground">
        Kegiatan atau halaman yang Anda cari tidak ada di dataset JejakDana. Pilih kegiatan dari katalog.
      </p>
      <Button asChild className="mt-6 h-11 px-5">
        <Link href="/proyek">Buka katalog</Link>
      </Button>
    </div>
  )
}

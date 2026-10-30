"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Terjadi kesalahan</h1>
      <p className="mt-3 text-muted-foreground">Halaman tidak dapat ditampilkan. Silakan coba lagi.</p>
      <Button onClick={reset} className="mt-6 h-11 px-5">
        Coba lagi
      </Button>
    </div>
  )
}

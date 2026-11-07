"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { REPORT_MAX, REPORT_MIN } from "@/lib/reports"

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string }

export function ReportForm({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("")
  const [observedOn, setObservedOn] = useState("")
  const [website, setWebsite] = useState("") // honeypot; manusia tidak melihatnya
  const [state, setState] = useState<State>({ kind: "idle" })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState({ kind: "sending" })
    try {
      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, body, observed_on: observedOn || null, website }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (res.ok) {
        setBody("")
        setObservedOn("")
        setState({ kind: "sent" })
      } else {
        setState({ kind: "error", message: data?.error ?? "Laporan belum dapat dikirim. Coba lagi nanti." })
      }
    } catch {
      setState({ kind: "error", message: "Tidak dapat terhubung. Periksa koneksi Anda lalu coba lagi." })
    }
  }

  const length = body.trim().length
  return (
    <form onSubmit={submit} aria-label="Kirim laporan warga" className="grid gap-4" data-testid="report-form">
      <div className="grid gap-1.5">
        <Label htmlFor="report-body" className="font-semibold text-navy">
          Kondisi yang Anda amati di lapangan
        </Label>
        <textarea
          id="report-body"
          required
          rows={5}
          maxLength={REPORT_MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-describedby="report-hint"
          placeholder="Contoh: trotoar di depan pasar sudah selesai dipasang, tetapi drainase di sisi barat masih terbuka."
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <p id="report-hint" className="text-sm text-muted-foreground">
          Minimal {REPORT_MIN} karakter · {length}/{REPORT_MAX}. Jangan menuliskan nama atau kontak pribadi.
        </p>
      </div>

      <div className="grid gap-1.5 sm:max-w-xs">
        <Label htmlFor="report-date" className="font-semibold text-navy">
          Tanggal pengamatan (opsional)
        </Label>
        <Input id="report-date" type="date" value={observedOn} onChange={(e) => setObservedOn(e.target.value)} className="h-11 bg-card" />
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className="grid justify-items-start gap-3">
        <Button type="submit" disabled={state.kind === "sending"} className="h-11 px-5 font-semibold">
          {state.kind === "sending" ? "Mengirim…" : "Kirim laporan"}
        </Button>
        <p role="status" aria-live="polite" data-testid="report-status" className="text-sm font-semibold">
          {state.kind === "sent" && <span className="text-ok-foreground">Terima kasih. Laporan diterima dan menunggu moderasi sebelum ditampilkan.</span>}
          {state.kind === "error" && <span className="text-destructive">{state.message}</span>}
        </p>
      </div>
    </form>
  )
}

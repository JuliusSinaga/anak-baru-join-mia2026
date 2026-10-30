import { SITE } from "@/lib/site"

export function DisclaimerBar() {
  return (
    <div role="note" data-testid="disclaimer-bar" className="bg-navy py-1.5 text-[0.85rem] text-slate-200">
      <div className="mx-auto max-w-6xl px-4">
        <strong className="text-white">Situs independen.</strong> {SITE.disclaimer}
      </div>
    </div>
  )
}

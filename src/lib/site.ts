export const SITE = {
  name: "JejakDana",
  tagline: "Dari Anggaran ke Dampak Nyata",
  description:
    "Website independen untuk mencari kegiatan pembangunan jalan dan trotoar Kota Medan yang disebut dalam publikasi resmi, lengkap dengan tautan sumber dan keterbatasan datanya.",
  disclaimer: "JejakDana bukan situs resmi Pemerintah Kota Medan dan bukan kanal pengaduan resmi.",
}

/** URL publik untuk metadata/sitemap. Set NEXT_PUBLIC_SITE_URL saat deploy; Vercel menyediakan fallback otomatis. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, "")
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}

export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/proyek", label: "Katalog" },
  { href: "/#metodologi", label: "Metodologi" },
] as const

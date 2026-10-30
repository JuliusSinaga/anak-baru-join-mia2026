# JejakDana — Dari Anggaran ke Dampak Nyata

JejakDana adalah website **independen** untuk membantu warga Kota Medan mencari kegiatan pembangunan **jalan dan trotoar** yang disebut dalam publikasi resmi pemerintah, memahami apa yang sudah dan belum diketahui, lalu menelusuri langsung ke sumber aslinya.

> JejakDana **bukan** situs resmi Pemerintah Kota Medan, bukan portal keuangan pemerintah, bukan pelacak real-time, dan bukan kanal pengaduan resmi.

Dibuat untuk kompetisi **Web In Action (WIA), MIA 2026**. Tema: *Designing Digital Futures – Powering Public Transparency*.

## Halaman

| Route | Isi |
|---|---|
| `/` | Hero, ringkasan cakupan yang **dihitung dari dataset**, misi, CTA ke katalog, metodologi & keterbatasan (`/#metodologi`) |
| `/proyek` | Katalog: pencarian, filter kategori + status, jumlah hasil, empty state, reset. Filter tersimpan di URL (`/proyek?q=juanda&kategori=Trotoar`) |
| `/proyek/[slug]` | Detail kegiatan: status menurut sumber + tanggal, ringkasan, informasi, data anggaran/progres ("Belum terverifikasi"), tautan sumber asli, asal data, keterbatasan |

Di setiap halaman tampil disclaimer "Situs independen". Nilai `null` untuk pagu, kontrak, progres, dan RUP tidak pernah ditampilkan sebagai 0 atau Rp0.

## Tech stack

- **Next.js 15** (App Router, semua halaman statis/SSG), **React 19**, **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix): Button, Badge, Input, Label, Select, Sheet, Alert, Skeleton
- Data: JSON lokal `data/projects.json`, **tanpa database** pada First Draft
- Kualitas: ESLint, `tsc`, Vitest (unit), playwright-core + Microsoft Edge (E2E)

Rincian keputusan arsitektur ada di [ARCHITECTURE.md](ARCHITECTURE.md).

## Menjalankan secara lokal

Prasyarat: **Node.js 20+** dan npm.

```bash
git clone <URL-REPOSITORY>
cd anak-baru-join-mia2026
npm install
npm run dev          # http://localhost:3000 (mode pengembangan)
```

Mode production:

```bash
npm run build        # memvalidasi data/projects.json lalu build statis
npm start            # http://localhost:3000
```

## Pengujian & quality gate

```bash
npm run validate     # validasi dataset (skema + aturan integritas)
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # 12 unit test (Vitest)
npm run build
npm run test:e2e     # 18 tes E2E terhadap build production (butuh Microsoft Edge; BROWSER_CHANNEL=chrome untuk Chrome)
npm run check        # semua langkah di atas berurutan
```

Cakupan E2E:
- AC-01 sampai AC-08 dari project brief: render semua entri, cari "juanda", filter Trotoar, filter status + empty state + reset, URL sumber persis di keenam detail, null tampil jujur, menu mobile ditutup ESC dengan fokus kembali, tanpa overflow di 360/768/1280 px, disclaimer.
- 404, Select via keyboard, tautan internal, dan skip link.
- SEO (title, description, OG, canonical, sitemap, robots) dan header keamanan.

Screenshot QA tersimpan di `test-results/` (di-ignore git).

## Dataset

`data/projects.json` berisi 6 kegiatan dari publikasi resmi `portal.medan.go.id` dan `sdabmbk.medan.go.id`:

| slug | Kegiatan | Kategori | Status menurut sumber | Tanggal sumber |
|---|---|---|---|---|
| `juanda` | Penataan Trotoar Jalan Juanda | Trotoar | Pelaksanaan dilaporkan | 2026-10-12 |
| `merak-jingga` | Penataan Trotoar Jalan Merak Jingga | Trotoar | Pelaksanaan dilaporkan | 2026-10-12 |
| `takenaka` | Pembetonan Jalan Takenaka | Jalan | Pelaksanaan dilaporkan | 2026-07-15 |
| `pimpinan-gurilla` | Perbaikan Jalan Pimpinan dan Gurilla | Jalan | Selesai menurut sumber | 2026-07-29 |
| `speksi-kanal` | Pengaspalan Jalan Speksi Kanal | Jalan | Selesai menurut sumber | 2026-04-29 |
| `ar-hakim-aksara` | Penanganan Titik Jalan AR Hakim–Aksara | Jalan | Perbaikan titik dilaporkan | 2026-05-20 |

Semua nilai pagu, kontrak, progres fisik, dan kode RUP bernilai `null`. Data dikurasi per 30 Oktober 2026. `data/projects.csv` adalah versi tabular untuk kurasi; setiap perubahan harus diterapkan di kedua berkas.

Catatan: Juanda dan Merak Jingga berasal dari satu publikasi yang sama. Pimpinan dan Gurilla adalah dua ruas dalam satu entri, dan itu tidak berarti satu kontrak.

### Menambah atau mengubah data

1. Edit `data/projects.json` (`id` = slug URL: huruf kecil, angka, tanda hubung).
2. Kolom anggaran/progres/RUP tetap `null` kecuali ada dokumen primer (SiRUP/kontrak) yang cocok.
3. Jalankan `npm run validate`. Build juga akan gagal bila data tidak valid.

Aturan yang dicek: field wajib, kategori/status dikenal, tanggal valid dan `as_of` ≥ tanggal sumber, `source_url` https di domain `*.medan.go.id`, nilai `0` untuk data anggaran ditolak.

## Deploy ke Vercel

1. Push repository ke GitHub (publik untuk First Draft).
2. Di Vercel: **Add New → Project → Import** repository ini. Framework terdeteksi otomatis sebagai Next.js; build command `npm run build`, tanpa konfigurasi tambahan.
3. Opsional: set environment variable `NEXT_PUBLIC_SITE_URL` (mis. `https://jejakdana.vercel.app`) agar URL di sitemap/canonical memakai domain final. Tanpa itu, domain produksi Vercel dipakai otomatis.
4. Buka URL publik dari HP/mode incognito dan cek `/`, `/proyek`, dan satu `/proyek/[slug]`.

## Progres

- **30 Okt 2026 (v0.1.0):** audit repo, implementasi P0 dalam HTML/CSS/JS vanilla, validator, tes E2E.
- **30 Okt 2026 (v0.2.0):** migrasi ke Next.js + TypeScript + Tailwind + shadcn/ui, route `/`, `/proyek`, `/proyek/[slug]`, SEO dasar, header keamanan, unit test + E2E. Versi vanilla disimpan di `legacy/vanilla/`.
- **Belum:** verifikasi manual keenam tautan sumber oleh tim, deploy publik, screenshot resmi untuk PDF, uji pengguna.

Riwayat perubahan: [CHANGELOG.md](CHANGELOG.md).

## Keterbatasan

- Setiap entri adalah **kegiatan yang disebut publikasi resmi**, bukan paket pengadaan yang sudah dicocokkan dengan SiRUP.
- Status adalah yang **dilaporkan sumber pada tanggal publikasi**, bukan kondisi saat ini dan bukan hasil inspeksi lapangan JejakDana.
- Pagu, nilai kontrak, progres fisik, dan kode RUP belum terverifikasi. JejakDana tidak menampilkan total anggaran.
- Cakupan First Draft: Kota Medan, sektor jalan/trotoar, 6 entri. Fitur dokumentasi warga, moderasi, login, dan database belum dibuat (P1).

## Screenshot

_Belum ditambahkan._ Ambil dari situs yang sudah di-deploy:
1. landing 1280 px;
2. katalog dengan pencarian "Juanda";
3. halaman `/proyek/juanda`;
4. tampilan ponsel 360 px.

Simpan di `docs/screenshots/` dan tautkan di sini.

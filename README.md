# JejakDana — Dari Anggaran ke Dampak Nyata

Website independen untuk membantu warga Kota Medan menelusuri kegiatan pembangunan jalan dan trotoar yang disebut dalam publikasi resmi pemerintah, lalu menautkannya langsung ke sumber aslinya. Dibuat untuk kompetisi **Web In Action (WIA), MIA 2026**.

## Tech stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- Data kegiatan: JSON lokal (`data/projects.json`), divalidasi saat build
- Laporan warga: **Supabase** (Postgres), opsional

## Cara menjalankan project

Prasyarat: **Node.js 20+** dan npm.

```bash
git clone https://github.com/JuliusSinaga/anak-baru-join-mia2026.git
cd anak-baru-join-mia2026
npm install
npm run dev          # http://localhost:3000
```

## Memperbarui data kegiatan

Edit `data/projects.csv` (mis. dari spreadsheet), lalu jalankan `npm run import:data`. Skrip mengubahnya menjadi `data/projects.json` dan memvalidasinya; bila ada error, berkas lama tidak diubah. Pagu, nilai kontrak, progres, dan kode RUP dibiarkan kosong sampai ada dokumen primer.

## Laporan warga (Supabase)

Pada halaman detail kegiatan, warga dapat mengirim laporan kondisi lapangan tanpa login. Laporan **tidak ditampilkan sebelum disetujui moderator** dan diberi label "belum diverifikasi JejakDana".

Mengaktifkan:

1. Buat project di Supabase, lalu jalankan `supabase/migrations/20261107000000_reports.sql` di SQL Editor.
2. Isi variabel lingkungan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (lihat `.env.example`; di Vercel lewat Project Settings, lalu **redeploy**, karena nilainya dibaca saat build). Kunci ini melewati RLS: hanya di server, jangan diberi awalan `NEXT_PUBLIC_`.
3. Tanpa kedua variabel, bagian laporan tidak tampil dan `/api/laporan` menjawab 503. Situs tetap berjalan.

Moderasi: buka **Table Editor → reports**, ubah kolom `status` dari `pending` menjadi `approved` (tampil) atau `rejected`. Laporan yang disetujui muncul di situs dalam sekitar 1 menit.

Keamanan: tabel memakai RLS tanpa policy sehingga kunci publik tidak bisa membaca/menulis; semua akses lewat `/api/laporan` yang memeriksa Origin, panjang isi, kegiatan yang dikenal, honeypot, dan batas 3 laporan per jam per IP. IP disimpan hanya sebagai HMAC untuk pembatasan laju, tanpa nama atau kontak pelapor.

## Progress pengerjaan

- **30 Okt 2026:** prototipe awal (HTML/CSS/JS vanilla), lalu migrasi ke Next.js + TypeScript + Tailwind + shadcn/ui dengan route `/`, `/proyek`, `/proyek/[slug]`.
- **1 Nov 2026:** deploy publik ke Vercel, verifikasi manual keenam tautan sumber data oleh tim selesai dan valid.

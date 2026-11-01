# JejakDana — Dari Anggaran ke Dampak Nyata

Website independen untuk membantu warga Kota Medan menelusuri kegiatan pembangunan jalan dan trotoar yang disebut dalam publikasi resmi pemerintah, lalu menautkannya langsung ke sumber aslinya. Dibuat untuk kompetisi **Web In Action (WIA), MIA 2026**.

## Tech stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI)
- Data: JSON lokal (`data/projects.json`), tanpa database pada First Draft

## Cara menjalankan project

Prasyarat: **Node.js 20+** dan npm.

```bash
git clone https://github.com/JuliusSinaga/anak-baru-join-mia2026.git
cd anak-baru-join-mia2026
npm install
npm run dev          # http://localhost:3000
```

## Progress pengerjaan

- **30 Okt 2026:** prototipe awal (HTML/CSS/JS vanilla), lalu migrasi ke Next.js + TypeScript + Tailwind + shadcn/ui dengan route `/`, `/proyek`, `/proyek/[slug]`.
- **1 Nov 2026:** deploy publik ke Vercel, verifikasi manual keenam tautan sumber data oleh tim selesai dan valid.

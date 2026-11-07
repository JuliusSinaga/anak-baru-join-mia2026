-- Laporan warga untuk JejakDana.
-- Jalankan di Supabase: SQL Editor -> tempel -> Run (atau `supabase db push`).
--
-- Model akses: RLS aktif TANPA policy, sehingga kunci publik (anon/authenticated) tidak bisa
-- membaca maupun menulis. Semua akses lewat server Next.js dengan SUPABASE_SERVICE_ROLE_KEY,
-- yang menegakkan validasi, batas laju, dan hanya menampilkan laporan berstatus 'approved'.

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,                       -- id kegiatan di data/projects.json
  body        text not null check (char_length(body) between 20 and 1000),
  observed_on date,                                -- tanggal warga mengamati kondisi lapangan
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash     text not null,                       -- HMAC alamat IP, hanya untuk pembatasan laju
  created_at  timestamptz not null default now()
);

create index reports_approved_idx on public.reports (project_id, created_at desc) where status = 'approved';
create index reports_ip_recent_idx on public.reports (ip_hash, created_at desc);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

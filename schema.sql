-- ============================================================
-- Buletin Editor — Supabase schema
-- Jalankan seluruh isi file ini di: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- Tabel utama: satu baris = satu buletin yang disimpan
create table if not exists public.buletins (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Tanpa Judul',
  layout text not null default 'classic',
  theme jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buletins_updated_at_idx on public.buletins (updated_at desc);

-- Row Level Security
alter table public.buletins enable row level security;

-- Kebijakan berikut mengizinkan akses publik penuh (baca/tulis) memakai
-- anon key — cocok untuk alat pribadi/internal tanpa login. Jika buletin ini
-- akan dipakai banyak orang dan datanya perlu dipisah per pengguna, ganti
-- kebijakan ini dengan versi yang memvalidasi auth.uid() setelah mengaktifkan
-- Supabase Auth.
drop policy if exists "Public read buletins" on public.buletins;
create policy "Public read buletins" on public.buletins for select using (true);

drop policy if exists "Public insert buletins" on public.buletins;
create policy "Public insert buletins" on public.buletins for insert with check (true);

drop policy if exists "Public update buletins" on public.buletins;
create policy "Public update buletins" on public.buletins for update using (true);

drop policy if exists "Public delete buletins" on public.buletins;
create policy "Public delete buletins" on public.buletins for delete using (true);

-- ============================================================
-- Storage: bucket publik untuk foto header, foto dokumentasi & background
-- ============================================================
insert into storage.buckets (id, name, public)
values ('buletin-images', 'buletin-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read buletin images" on storage.objects;
create policy "Public read buletin images" on storage.objects
  for select using (bucket_id = 'buletin-images');

drop policy if exists "Public upload buletin images" on storage.objects;
create policy "Public upload buletin images" on storage.objects
  for insert with check (bucket_id = 'buletin-images');

drop policy if exists "Public update buletin images" on storage.objects;
create policy "Public update buletin images" on storage.objects
  for update using (bucket_id = 'buletin-images');

drop policy if exists "Public delete buletin images" on storage.objects;
create policy "Public delete buletin images" on storage.objects
  for delete using (bucket_id = 'buletin-images');

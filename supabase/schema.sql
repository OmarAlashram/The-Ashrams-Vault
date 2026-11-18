-- The Ashrams Vault — Phase 1 schema
-- Run in Supabase: SQL Editor → New query → paste → Run

create extension if not exists pgcrypto;

create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  owner_member text not null,          -- e.g. 'Omar', 'Leen', 'Yasmine', 'Talal', 'Household'
  category     text not null,          -- e.g. 'Passport', 'Saudi ID', 'Medical Insurance'
  title        text not null,          -- display name, e.g. 'Jordanian Passport - Omar'
  file_path    text not null,          -- path inside the private 'vault' bucket
  mime_type    text,
  expires_on   date,                   -- only for passports (per tracker rule)
  uploaded_by  uuid references auth.users(id) default auth.uid(),
  created_at   timestamptz not null default now()
);

create index if not exists documents_owner_idx on public.documents (owner_member);
create index if not exists documents_title_idx on public.documents using gin (to_tsvector('simple', title));

alter table public.documents enable row level security;

-- Only signed-in family members can read or change documents.
-- Turn OFF public sign-ups in Supabase (Authentication → Providers → Email → "Allow new users to sign up")
-- and invite only your and your wife's email addresses.
drop policy if exists "family can read documents" on public.documents;
create policy "family can read documents" on public.documents
  for select to authenticated using (true);

drop policy if exists "family can add documents" on public.documents;
create policy "family can add documents" on public.documents
  for insert to authenticated with check (true);

drop policy if exists "family can edit documents" on public.documents;
create policy "family can edit documents" on public.documents
  for update to authenticated using (true) with check (true);

drop policy if exists "family can delete documents" on public.documents;
create policy "family can delete documents" on public.documents
  for delete to authenticated using (true);

-- Private storage bucket for the files themselves
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

drop policy if exists "family can read vault files" on storage.objects;
create policy "family can read vault files" on storage.objects
  for select to authenticated using (bucket_id = 'vault');

drop policy if exists "family can upload vault files" on storage.objects;
create policy "family can upload vault files" on storage.objects
  for insert to authenticated with check (bucket_id = 'vault');

drop policy if exists "family can delete vault files" on storage.objects;
create policy "family can delete vault files" on storage.objects
  for delete to authenticated using (bucket_id = 'vault');

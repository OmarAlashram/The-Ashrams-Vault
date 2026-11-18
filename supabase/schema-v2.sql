-- The Ashrams Vault — v2: family members, folders and photos
-- Run ONCE in Supabase: SQL Editor → New query → paste → Run

-- 1. Family members (each has a photo or initials)
create table if not exists public.members (
  id           text primary key,
  display_name text not null,
  group_name   text not null default 'Family',
  avatar_path  text,
  sort_order   int not null default 0
);

-- 2. Folders (can contain folders and documents)
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  member_id  text not null references public.members(id) on delete cascade,
  parent_id  uuid references public.folders(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists folders_member_idx on public.folders(member_id);
create index if not exists folders_parent_idx on public.folders(parent_id);

-- 3. Documents now belong to a folder
alter table public.documents add column if not exists folder_id uuid references public.folders(id) on delete set null;
alter table public.documents alter column owner_member drop not null;
alter table public.documents alter column category drop not null;
create index if not exists documents_folder_idx on public.documents(folder_id);

-- 4. Security: only signed-in family members
alter table public.members enable row level security;
alter table public.folders enable row level security;

drop policy if exists "family reads members" on public.members;
create policy "family reads members" on public.members for select to authenticated using (true);
drop policy if exists "family changes members" on public.members;
create policy "family changes members" on public.members for all to authenticated using (true) with check (true);

drop policy if exists "family reads folders" on public.folders;
create policy "family reads folders" on public.folders for select to authenticated using (true);
drop policy if exists "family changes folders" on public.folders;
create policy "family changes folders" on public.folders for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

-- 5. Starting members
insert into public.members (id, display_name, group_name, sort_order) values
  ('omar',      'Omar',      'Family',            1),
  ('leen',      'Leen',      'Family',            2),
  ('yasmine',   'Yasmine',   'Family',            3),
  ('talal',     'Talal',     'Family',            4),
  ('jumana',    'Jumana',    'Parents & Sisters', 5),
  ('alayman',   'Alayman',   'Parents & Sisters', 6),
  ('dima',      'Dima',      'Parents & Sisters', 7),
  ('haneen',    'Haneen',    'Parents & Sisters', 8),
  ('household', 'Household', 'Household',         9)
on conflict (id) do nothing;

-- 6. Starting folders (from your iCloud structure)
insert into public.folders (member_id, name) values
  ('omar','Saudi ID'),('omar','Jordanian Passport'),('omar','Old Passports'),('omar','Jordanian Driving Licence'),
  ('omar','Jordanian ID'),('omar','Jordanian Birth Certificate'),('omar','Military Service'),('omar','Saudi Driving Licence'),
  ('omar','Car Licence'),('omar','Medical Insurance'),('omar','Car Insurance'),('omar','Jordanian Marriage Certificate'),
  ('omar','Saudi Marriage Certificate'),('omar','Family Book'),('omar','Parents Family Book'),('omar','Name Change'),
  ('omar','Education'),('omar','Personal Photo'),('omar','Health Omar'),
  ('leen','Saudi ID'),('leen','Jordanian Passport'),('leen','Syrian Passport'),('leen','Old Passports'),('leen','Jordanian ID'),
  ('leen','Syrian ID'),('leen','Syrian Driving Licence'),('leen','Saudi Driving Licence'),('leen','Car Licence'),
  ('leen','Medical Insurance'),('leen','Car Insurance'),('leen','Jordanian Marriage Certificate'),('leen','Saudi Marriage Certificate'),
  ('leen','Family Book'),('leen','Education'),('leen','Personal Photo'),('leen','Health Leen'),
  ('yasmine','Saudi ID'),('yasmine','Jordanian Passport'),('yasmine','Saudi Birth Certificate'),('yasmine','Jordanian Birth Certificate'),
  ('yasmine','Medical Insurance'),('yasmine','Family Book'),('yasmine','Personal Photo'),('yasmine','Health Yasmine'),
  ('talal','Saudi ID'),('talal','Jordanian Passport'),('talal','Saudi Birth Certificate'),('talal','Jordanian Birth Certificate'),
  ('talal','Medical Insurance'),('talal','Family Book'),('talal','Personal Photo'),('talal','Health Talal'),
  ('jumana','Passport'),('jumana','Personal Photo'),
  ('alayman','Passport'),('alayman','Personal Photo'),
  ('dima','Passport'),('dima','Personal Photo'),
  ('haneen','Passport'),('haneen','Personal Photo'),
  ('household','Proof of Address'),('household','Invoices'),('household','Cristina');

-- Health subfolders for each member
insert into public.folders (member_id, parent_id, name)
select h.member_id, h.id, s.name
from public.folders h
cross join (values ('Vaccines'), ('Surgeries'), ('Medical Tests'), ('Doctor Visits')) as s(name)
where h.name like 'Health %';

-- Cristina's subfolders
insert into public.folders (member_id, parent_id, name)
select h.member_id, h.id, s.name
from public.folders h
cross join (values ('Passport'), ('Iqama'), ('Contract')) as s(name)
where h.name = 'Cristina';

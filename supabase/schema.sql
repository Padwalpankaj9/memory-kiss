create table if not exists public.kisses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  share_token text not null unique,
  sender_name text not null default 'You',
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  kiss_id uuid not null references public.kisses(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  photo_url text not null,
  caption text not null,
  created_at timestamptz not null default now()
);

alter table public.kisses
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.kisses
  alter column owner_id set default auth.uid();

alter table public.kisses
  add column if not exists share_token text;

update public.kisses
set share_token = replace(id::text, '-', '')
where share_token is null;

alter table public.kisses
  alter column share_token set not null;

alter table public.memories
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.memories
  alter column owner_id set default auth.uid();

create index if not exists memories_kiss_id_created_at_idx
  on public.memories (kiss_id, created_at desc);

create unique index if not exists kisses_share_token_idx
  on public.kisses (share_token);

create index if not exists kisses_owner_id_created_at_idx
  on public.kisses (owner_id, created_at desc);

create index if not exists memories_owner_id_created_at_idx
  on public.memories (owner_id, created_at desc);

alter table public.kisses enable row level security;
alter table public.memories enable row level security;

drop policy if exists "Anyone can read kisses" on public.kisses;
drop policy if exists "Creators can read own kisses" on public.kisses;
create policy "Creators can read own kisses"
on public.kisses for select
using (owner_id = auth.uid());

drop policy if exists "Anyone can create kisses" on public.kisses;
drop policy if exists "Creators can create kisses" on public.kisses;
create policy "Creators can create kisses"
on public.kisses for insert
with check (owner_id = auth.uid());

drop policy if exists "Creators can update own kisses" on public.kisses;
create policy "Creators can update own kisses"
on public.kisses for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Creators can delete own kisses" on public.kisses;
create policy "Creators can delete own kisses"
on public.kisses for delete
using (owner_id = auth.uid());

drop policy if exists "Anyone can read memories" on public.memories;
drop policy if exists "Creators can read own memories" on public.memories;
create policy "Creators can read own memories"
on public.memories for select
using (owner_id = auth.uid());

drop policy if exists "Anyone can create memories" on public.memories;
drop policy if exists "Creators can create memories for own kisses" on public.memories;
create policy "Creators can create memories for own kisses"
on public.memories for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.kisses
    where kisses.id = memories.kiss_id
      and kisses.owner_id = auth.uid()
  )
);

drop policy if exists "Anyone can delete memories" on public.memories;
drop policy if exists "Creators can delete own memories" on public.memories;
create policy "Creators can delete own memories"
on public.memories for delete
using (owner_id = auth.uid());

create or replace function public.get_public_kiss(p_share_token text)
returns table (
  id uuid,
  sender_name text,
  share_token text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select kisses.id, kisses.sender_name, kisses.share_token, kisses.created_at
  from public.kisses
  where kisses.share_token = p_share_token
  limit 1;
$$;

create or replace function public.get_public_memories(p_share_token text)
returns table (
  id uuid,
  kiss_id uuid,
  photo_url text,
  caption text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select memories.id, memories.kiss_id, memories.photo_url, memories.caption, memories.created_at
  from public.memories
  join public.kisses on kisses.id = memories.kiss_id
  where kisses.share_token = p_share_token
  order by memories.created_at desc;
$$;

grant execute on function public.get_public_kiss(text) to anon, authenticated;
grant execute on function public.get_public_memories(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public photo reads" on storage.objects;
create policy "Public photo reads"
on storage.objects for select
using (bucket_id = 'photos');

drop policy if exists "Public photo uploads" on storage.objects;
drop policy if exists "Creators can upload photos" on storage.objects;
create policy "Creators can upload photos"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public photo deletes" on storage.objects;
drop policy if exists "Creators can delete own photos" on storage.objects;
create policy "Creators can delete own photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

alter table public.recipes
  add column if not exists steps jsonb not null default '[]'::jsonb,
  add column if not exists source_url text,
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists cover_image_url text;

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload media'
  ) then
    create policy "Authenticated users can upload media"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update media'
  ) then
    create policy "Authenticated users can update media"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'media')
    with check (bucket_id = 'media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public media is readable'
  ) then
    create policy "Public media is readable"
    on storage.objects
    for select
    to public
    using (bucket_id = 'media');
  end if;
end $$;

-- Recipe books used to live only in AsyncStorage (device-local), keyed by
-- household id. That never actually synced across a household's different
-- devices/accounts, so "sharing a book with your household" silently did
-- nothing for anyone but the creator on their own device. This migration
-- moves books server-side with an explicit household_id (null = private to
-- the owner, set = shared with that household) and adds recipes.book_id so
-- a recipe's book membership lives with the recipe itself.

create table if not exists public.recipe_books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid null references public.households(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists recipe_books_owner_id_idx
  on public.recipe_books (owner_id);
create index if not exists recipe_books_household_id_idx
  on public.recipe_books (household_id);

alter table public.recipe_books enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'recipe_books'
      and policyname = 'Owners and household members can view recipe books'
  ) then
    create policy "Owners and household members can view recipe books"
    on public.recipe_books for select
    to authenticated
    using (
      owner_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'recipe_books'
      and policyname = 'Users can create their own recipe books'
  ) then
    create policy "Users can create their own recipe books"
    on public.recipe_books for insert
    to authenticated
    with check (
      owner_id = auth.uid()
      and (household_id is null or household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'recipe_books'
      and policyname = 'Owners and household members can update recipe books'
  ) then
    create policy "Owners and household members can update recipe books"
    on public.recipe_books for update
    to authenticated
    using (
      owner_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    )
    with check (
      owner_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'recipe_books'
      and policyname = 'Owners and household members can delete recipe books'
  ) then
    create policy "Owners and household members can delete recipe books"
    on public.recipe_books for delete
    to authenticated
    using (
      owner_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;
end $$;

alter table public.recipes
  add column if not exists book_id uuid null references public.recipe_books(id) on delete set null;

create index if not exists recipes_book_id_idx
  on public.recipes (book_id);

-- A recipe's book_id must point at a book the writer can actually see
-- (their own, or one shared with their household) — otherwise a client
-- could file a recipe under someone else's private book. RLS on
-- recipe_books can't enforce this by itself since it's a different table.
create or replace function public.recipes_validate_book_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.book_id is not null and not exists (
    select 1 from public.recipe_books b
    where b.id = new.book_id
      and (
        b.owner_id = auth.uid()
        or (b.household_id is not null and b.household_id in (
          select household_id from public.household_members where user_id = auth.uid()
        ))
      )
  ) then
    raise exception 'book_id does not reference an accessible recipe book';
  end if;
  return new;
end;
$$;

drop trigger if exists recipes_validate_book_id_trg on public.recipes;
create trigger recipes_validate_book_id_trg
before insert or update of book_id on public.recipes
for each row execute function public.recipes_validate_book_id();

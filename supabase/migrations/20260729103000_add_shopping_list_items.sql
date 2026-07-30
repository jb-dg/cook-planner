create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity text null,
  unit text null,
  is_checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'recipe', 'planner')),
  recipe_id uuid null references public.recipes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shopping_list_items_household_id_idx
  on public.shopping_list_items (household_id);
create index if not exists shopping_list_items_user_id_idx
  on public.shopping_list_items (user_id);

alter table public.shopping_list_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_items'
      and policyname = 'Members can view household shopping list items'
  ) then
    create policy "Members can view household shopping list items"
    on public.shopping_list_items for select
    to authenticated
    using (
      user_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_items'
      and policyname = 'Members can insert household shopping list items'
  ) then
    create policy "Members can insert household shopping list items"
    on public.shopping_list_items for insert
    to authenticated
    with check (
      user_id = auth.uid()
      and (household_id is null or household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_items'
      and policyname = 'Members can update household shopping list items'
  ) then
    create policy "Members can update household shopping list items"
    on public.shopping_list_items for update
    to authenticated
    using (
      user_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    )
    with check (
      user_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_items'
      and policyname = 'Members can delete household shopping list items'
  ) then
    create policy "Members can delete household shopping list items"
    on public.shopping_list_items for delete
    to authenticated
    using (
      user_id = auth.uid()
      or (household_id is not null and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      ))
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_list_items'
  ) then
    alter publication supabase_realtime add table public.shopping_list_items;
  end if;
end $$;

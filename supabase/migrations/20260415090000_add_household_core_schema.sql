-- Foundational schema for profiles, households, and household membership.
-- These tables/functions already exist on the live project but were never
-- captured in a tracked migration (the two later migrations in this repo
-- both assume they already exist). This file reconstructs them from actual
-- application usage in features/profile/hooks/useProfileScreenState.ts and
-- lib/households.ts, so the schema has a single source of truth going
-- forward. Every statement is idempotent: re-running this against the
-- existing live database is a no-op for objects that already exist.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pseudo text unique,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One household per user is the current product assumption everywhere in
-- the app (every query reads membership via .maybeSingle()). The unique
-- constraint on user_id enforces that at the database level. Revisit this
-- if multi-household membership is ever supported.
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists household_members_household_id_idx
  on public.household_members (household_id);
create index if not exists households_owner_id_idx
  on public.households (owner_id);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

do $$
begin
  -- Pseudo/email lookups (join-by-pseudo, invite-by-email) need to resolve
  -- arbitrary users, so profile lookups stay readable by any authenticated
  -- user. Only the owning user may write their own row.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Authenticated users can view profiles'
  ) then
    create policy "Authenticated users can view profiles"
    on public.profiles for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
    on public.profiles for insert
    to authenticated
    with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'households'
      and policyname = 'Members can view their household'
  ) then
    create policy "Members can view their household"
    on public.households for select
    to authenticated
    using (
      owner_id = auth.uid()
      or id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'households'
      and policyname = 'Users can create a household they own'
  ) then
    create policy "Users can create a household they own"
    on public.households for insert
    to authenticated
    with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'households'
      and policyname = 'Owners can update their household'
  ) then
    create policy "Owners can update their household"
    on public.households for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'households'
      and policyname = 'Owners can delete their household'
  ) then
    create policy "Owners can delete their household"
    on public.households for delete
    to authenticated
    using (owner_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_members'
      and policyname = 'Members can view their household roster'
  ) then
    create policy "Members can view their household roster"
    on public.household_members for select
    to authenticated
    using (
      user_id = auth.uid()
      or household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    );
  end if;

  -- Self-join (handleJoinHousehold) and owner-invite (handleInviteMember)
  -- both insert a membership row for a user that is not always auth.uid(),
  -- so this stays permissive at the table level; resolve_household_member_by_email
  -- and fetch_household_member_profiles are the actual authorization gate for
  -- who can be looked up and added.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_members'
      and policyname = 'Authenticated users can join or be added to a household'
  ) then
    create policy "Authenticated users can join or be added to a household"
    on public.household_members for insert
    to authenticated
    with check (
      user_id = auth.uid()
      or household_id in (
        select id from public.households where owner_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_members'
      and policyname = 'Members can leave or owners can remove members'
  ) then
    create policy "Members can leave or owners can remove members"
    on public.household_members for delete
    to authenticated
    using (
      user_id = auth.uid()
      or household_id in (
        select id from public.households where owner_id = auth.uid()
      )
    );
  end if;
end $$;

-- Resolves an email to a user_id for the invite-by-email flow
-- (handleInviteMember, features/profile/hooks/useProfileScreenState.ts).
-- SECURITY DEFINER bypasses the broad profiles SELECT policy above on
-- purpose, but is restricted to the calling household's owner so it can't
-- be used as a generic email-enumeration lookup by any authenticated user.
create or replace function public.resolve_household_member_by_email(
  p_household_id uuid,
  p_email text
)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.user_id
  from public.profiles p
  where lower(p.email) = lower(p_email)
    and exists (
      select 1 from public.households h
      where h.id = p_household_id and h.owner_id = auth.uid()
    )
  limit 1;
$$;

revoke all on function public.resolve_household_member_by_email(uuid, text) from public;
grant execute on function public.resolve_household_member_by_email(uuid, text) to authenticated;

-- Returns member profiles for a household (loadHousehold in
-- useProfileScreenState.ts). Restricted to callers who are themselves a
-- member of the household being queried.
create or replace function public.fetch_household_member_profiles(p_household_id uuid)
returns table (user_id uuid, pseudo text, email text)
language sql
security definer
set search_path = public
stable
as $$
  select p.user_id, p.pseudo, p.email
  from public.profiles p
  join public.household_members hm on hm.user_id = p.user_id
  where hm.household_id = p_household_id
    and exists (
      select 1 from public.household_members me
      where me.household_id = p_household_id and me.user_id = auth.uid()
    );
$$;

revoke all on function public.fetch_household_member_profiles(uuid) from public;
grant execute on function public.fetch_household_member_profiles(uuid) to authenticated;

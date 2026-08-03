-- Replaces two rough edges from the initial household schema
-- (supabase/migrations/20260415090000_add_household_core_schema.sql):
--
-- 1. Owner-invite-by-email used to write straight into household_members
--    with no consent step, and only worked if the invitee already had a
--    profiles row. It now creates a pending public.household_invites row
--    keyed by email, which works whether or not the invitee has an account
--    yet, and requires the invitee to accept before becoming a member.
-- 2. Join-by-admin-pseudo (typo-prone, undiscoverable, only worked for the
--    owner's own pseudo) is replaced by a short shareable invite_code on
--    households, resolved via resolve_household_by_invite_code.
--
-- resolve_household_member_by_email and fetch_household_member_profiles
-- from the previous migration are left in place (harmless, still gated by
-- their existing checks) but are no longer called by the app.

alter table public.households
  add column if not exists invite_code text;

update public.households
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

alter table public.households
  alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  alter column invite_code set not null;

create unique index if not exists households_invite_code_idx
  on public.households (invite_code);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  accepted_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists household_invites_household_id_idx
  on public.household_invites (household_id);
create index if not exists household_invites_email_idx
  on public.household_invites (email);

-- At most one active pending invite per (household, email) — re-inviting
-- while a prior invite is still pending hits this instead of duplicating.
create unique index if not exists household_invites_pending_unique_idx
  on public.household_invites (household_id, email)
  where status = 'pending';

alter table public.household_invites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_invites'
      and policyname = 'Owners and invitees can view relevant invites'
  ) then
    create policy "Owners and invitees can view relevant invites"
    on public.household_invites for select
    to authenticated
    using (
      household_id in (select id from public.households where owner_id = auth.uid())
      or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_invites'
      and policyname = 'Owners can create invites for their household'
  ) then
    create policy "Owners can create invites for their household"
    on public.household_invites for insert
    to authenticated
    with check (
      invited_by = auth.uid()
      and household_id in (select id from public.households where owner_id = auth.uid())
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'household_invites'
      and policyname = 'Owners can cancel, invitees can respond'
  ) then
    create policy "Owners can cancel, invitees can respond"
    on public.household_invites for update
    to authenticated
    using (
      household_id in (select id from public.households where owner_id = auth.uid())
      or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    with check (
      household_id in (select id from public.households where owner_id = auth.uid())
      or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
  end if;
end $$;

-- Resolves a household by its shareable invite code (join screen).
-- SECURITY DEFINER so a not-yet-member can resolve the code without a
-- broader households SELECT policy; deliberately returns only id/name.
create or replace function public.resolve_household_by_invite_code(p_code text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select h.id, h.name
  from public.households h
  where h.invite_code = upper(trim(p_code));
$$;

revoke all on function public.resolve_household_by_invite_code(text) from public;
grant execute on function public.resolve_household_by_invite_code(text) to authenticated;

-- Lists invites addressed to the caller's own email, regardless of
-- whether they've ever had a profiles row or household membership.
-- SECURITY DEFINER so it can join into households without needing a
-- broader households SELECT policy for non-members.
create or replace function public.fetch_my_pending_invites()
returns table (
  id uuid,
  household_id uuid,
  household_name text,
  invited_by_pseudo text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    hi.id,
    hi.household_id,
    h.name as household_name,
    coalesce(p.pseudo, split_part(p.email, '@', 1)) as invited_by_pseudo,
    hi.created_at
  from public.household_invites hi
  join public.households h on h.id = hi.household_id
  left join public.profiles p on p.user_id = hi.invited_by
  where hi.status = 'pending'
    and lower(hi.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by hi.created_at desc;
$$;

revoke all on function public.fetch_my_pending_invites() from public;
grant execute on function public.fetch_my_pending_invites() to authenticated;

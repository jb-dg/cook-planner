-- Fixes "infinite recursion detected in policy for relation
-- household_members" (Postgres error 42P17).
--
-- The SELECT policy added in 20260415090000_add_household_core_schema.sql
-- looked up the caller's own household_id by subquerying household_members
-- from within household_members' own SELECT policy:
--
--   household_id in (select household_id from household_members where user_id = auth.uid())
--
-- Evaluating that subquery re-applies the same SELECT policy to
-- household_members, which re-runs the subquery, forever. Moving the
-- lookup into a SECURITY DEFINER function breaks the cycle: the function
-- runs with row-level security bypassed, so it can read household_members
-- directly instead of going back through the policy that's calling it.

create or replace function public.current_user_household_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id from public.household_members where user_id = auth.uid() limit 1;
$$;

revoke all on function public.current_user_household_id() from public;
grant execute on function public.current_user_household_id() to authenticated;

drop policy if exists "Members can view their household roster" on public.household_members;
create policy "Members can view their household roster"
on public.household_members for select
to authenticated
using (
  user_id = auth.uid()
  or household_id = public.current_user_household_id()
);

-- THANAL registration setup
-- Run this once in Supabase SQL Editor after the public.users table has been
-- renamed to lowercase `users`.

-- Seed the three existing NSS units if they are not already present.
insert into public.units (unit_number)
select v.unit_number
from (values ('141'), ('257'), ('265')) as v(unit_number)
where not exists (
  select 1 from public.units u where u.unit_number = v.unit_number
);

-- Allow the registration form to read the list of units.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'units'
      and policyname = 'Anyone can read THANAL units'
  ) then
    create policy "Anyone can read THANAL units"
      on public.units for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Allow a signed-in user to create only their own profile row.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users'
      and policyname = 'Users can create their own profile'
  ) then
    create policy "Users can create their own profile"
      on public.users for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

notify pgrst, 'reload schema';

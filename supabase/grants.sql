-- Roamly — table grants
--
-- Run this whole file in the Supabase SQL editor.
--
-- RLS decides which ROWS a role may touch. Grants decide whether it may
-- touch the table at all. Both are needed; without these you get:
--   42501  permission denied for table trips
--
-- Every statement is on a single line on purpose — a wrapped GRANT that
-- loses its continuation line is a syntax error, and the SQL editor rolls
-- back the entire batch when one statement fails.

grant usage on schema public to anon, authenticated, service_role;

-- Public site and the build script only ever read these two.
grant select on public.trips to anon;
grant select on public.settings to anon;
grant select on public.trips to authenticated;
grant select on public.settings to authenticated;

-- Admin writes. RLS policies still apply on top of these.
grant insert, update, delete on public.trips to authenticated;
grant insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

-- Migration / server-side only. service_role bypasses RLS.
grant all privileges on public.trips to service_role;
grant all privileges on public.members to service_role;
grant all privileges on public.expenses to service_role;
grant all privileges on public.settings to service_role;

-- anon is deliberately granted NOTHING on members or expenses.
-- That missing grant is a second lock, independent of RLS.

-- PostgREST caches the schema; nudge it so the new grants take effect now.
notify pgrst, 'reload schema';

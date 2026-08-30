-- ============================================================
-- Roamly — Supabase schema
--
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Design notes
--   * Nested structures (gallery, itinerary, pickups, guide, blurb,
--     badges) stay as jsonb rather than being normalised into child
--     tables. That keeps the generated assets/data.js byte-identical in
--     shape to what the nine public pages already read, so none of them
--     need to change. Normalise later if you ever need to query inside
--     an itinerary.
--   * Column names are snake_case (Postgres convention). The build and
--     admin scripts map to/from the camelCase the front-end uses.
--   * RLS is ON for every table. `trips` is world-readable because the
--     public site needs it; `members` and `expenses` are NOT — they hold
--     customer contact details and cost data.
-- ============================================================

-- ---------- trips ----------
create table if not exists public.trips (
  id          text primary key,
  code        text not null,
  name        text not null,
  short       text not null,
  accent      text default '',
  region      text not null,
  category    text not null default 'weekend',
  days        integer not null check (days between 1 and 60),
  grade       text not null,
  price       integer not null check (price >= 0),
  rating      numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews     integer not null default 0,
  slots       integer not null check (slots between 1 and 100),
  status      text not null default 'upcoming'
              check (status in ('active','upcoming','completed')),
  start_date  text default '',
  end_date    text default '',
  dates       text not null,
  featured    text,
  hero        text not null,
  hero_alt    text not null,
  badges      jsonb not null default '[]'::jsonb,
  gallery     jsonb not null default '[]'::jsonb,
  blurb       jsonb not null default '[]'::jsonb,
  itinerary   jsonb not null default '[]'::jsonb,
  guide       jsonb not null default '{}'::jsonb,
  pickups     jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- members (PII) ----------
create table if not exists public.members (
  id         text primary key,
  trip_id    text not null references public.trips(id) on delete cascade,
  name       text not null,
  phone      text default '',
  email      text default '',
  age        integer,
  gender     text default '',
  pickup_id  text default '',
  ref        text default '',
  amount     integer not null default 0 check (amount >= 0),
  paid       integer not null default 0 check (paid >= 0),
  status     text not null default 'pending' check (status in ('paid','pending')),
  attended   boolean not null default false,
  note       text default '',
  booked_at  timestamptz not null default now(),
  paid_at    timestamptz,
  constraint members_paid_lte_amount check (paid <= amount)
);

create index if not exists members_trip_id_idx on public.members (trip_id);
create index if not exists members_status_idx  on public.members (status);

-- ---------- expenses ----------
create table if not exists public.expenses (
  id        text primary key,
  trip_id   text not null references public.trips(id) on delete cascade,
  title     text not null,
  category  text default '',
  amount    integer not null default 0,
  date      text default '',
  notes     text default ''
);

create index if not exists expenses_trip_id_idx on public.expenses (trip_id);

-- ---------- settings (single row) ----------
create table if not exists public.settings (
  id         integer primary key default 1 check (id = 1),
  deposit    integer not null default 1000,
  categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------- keep updated_at honest ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
--
-- Without these policies the anon key would expose customer phone
-- numbers and emails to anyone who found the project URL.
-- ============================================================
alter table public.trips    enable row level security;
alter table public.members  enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

-- trips: anyone may read (the public site and the build script do),
-- only a signed-in admin may write.
drop policy if exists "trips are publicly readable" on public.trips;
create policy "trips are publicly readable"
  on public.trips for select
  using (true);

drop policy if exists "trips are writable by authenticated users" on public.trips;
create policy "trips are writable by authenticated users"
  on public.trips for all
  to authenticated
  using (true) with check (true);

-- settings: same shape as trips (deposit is shown on the public site).
drop policy if exists "settings are publicly readable" on public.settings;
create policy "settings are publicly readable"
  on public.settings for select
  using (true);

drop policy if exists "settings are writable by authenticated users" on public.settings;
create policy "settings are writable by authenticated users"
  on public.settings for all
  to authenticated
  using (true) with check (true);

-- members: NO anonymous access at all. Deliberately no `for select
-- using (true)` policy here — that omission is the protection.
drop policy if exists "members are admin only" on public.members;
create policy "members are admin only"
  on public.members for all
  to authenticated
  using (true) with check (true);

-- expenses: internal cost data, same treatment as members.
drop policy if exists "expenses are admin only" on public.expenses;
create policy "expenses are admin only"
  on public.expenses for all
  to authenticated
  using (true) with check (true);

-- ============================================================
-- GRANTS
--
-- RLS decides which ROWS a role may touch; grants decide whether the
-- role may touch the table at all. Both are required — a table with
-- perfect policies and no grant returns:
--   42501  permission denied for table trips
--
-- Supabase usually applies these defaults itself, but a table created
-- outside that path (or in a project where the defaults were altered)
-- needs them stated explicitly.
--
-- Least privilege on purpose:
--   anon           may only READ the two public tables
--   authenticated  full access, still filtered by RLS policies
--   service_role   full access, bypasses RLS (used only by the seed script)
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;

-- public site + build script
grant select on public.trips    to anon, authenticated;
grant select on public.settings to anon, authenticated;

-- admin (RLS still applies on top of these)
grant insert, update, delete on public.trips    to authenticated;
grant insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.members  to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;

-- migration / server-side only
grant all privileges on public.trips, public.members,
                        public.expenses, public.settings to service_role;

-- anon is deliberately NOT granted anything on members or expenses.
-- Even if a policy were added by mistake, the missing grant stops a read.

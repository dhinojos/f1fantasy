create extension if not exists "pgcrypto";

create or replace function public.array_has_unique_values(target text[])
returns boolean
language sql
immutable
as $$
  select cardinality(target) = (
    select count(distinct value)
    from unnest(target) as value
  );
$$;

create table if not exists public.allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'player')) default 'player',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.drivers (
  id text primary key,
  code text not null unique,
  full_name text not null,
  team_name text not null,
  team_color text not null,
  car_number integer not null unique
);

create table if not exists public.races (
  id uuid primary key default gen_random_uuid(),
  grand_prix_name text not null,
  round_number integer not null unique,
  race_date date not null,
  sprint_lock_at timestamptz,
  lock_at timestamptz not null,
  has_sprint boolean not null default false,
  status text not null check (status in ('upcoming', 'locked', 'scored')) default 'upcoming',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.races add column if not exists has_sprint boolean not null default false;
alter table public.races add column if not exists sprint_lock_at timestamptz;

create table if not exists public.race_drivers (
  race_id uuid not null references public.races(id) on delete cascade,
  driver_id text not null references public.drivers(id) on delete cascade,
  primary key (race_id, driver_id)
);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sprint_winner_driver_id text references public.drivers(id),
  sprint_second_driver_id text references public.drivers(id),
  pole_driver_id text not null references public.drivers(id),
  top10_driver_ids text[] not null check (cardinality(top10_driver_ids) = 10),
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (race_id, user_id),
  check (array_has_unique_values(top10_driver_ids))
);

alter table public.picks add column if not exists sprint_winner_driver_id text references public.drivers(id);
alter table public.picks add column if not exists sprint_second_driver_id text references public.drivers(id);
alter table public.picks alter column sprint_winner_driver_id drop not null;
alter table public.picks alter column sprint_second_driver_id drop not null;

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null unique references public.races(id) on delete cascade,
  sprint_winner_driver_id text references public.drivers(id),
  sprint_second_driver_id text references public.drivers(id),
  pole_driver_id text not null references public.drivers(id),
  top10_driver_ids text[] not null check (cardinality(top10_driver_ids) = 10),
  updated_at timestamptz not null default timezone('utc', now()),
  check (array_has_unique_values(top10_driver_ids))
);

alter table public.results add column if not exists sprint_winner_driver_id text references public.drivers(id);
alter table public.results add column if not exists sprint_second_driver_id text references public.drivers(id);
alter table public.results alter column sprint_winner_driver_id drop not null;
alter table public.results alter column sprint_second_driver_id drop not null;

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.races(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sprint_points integer not null default 0,
  pole_points integer not null default 0,
  podium_points integer not null default 0,
  top10_points integer not null default 0,
  race_points integer not null default 0,
  cumulative_points integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (race_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  approved_email public.allowed_emails;
begin
  select *
  into approved_email
  from public.allowed_emails
  where lower(email) = lower(new.email);

  if approved_email is null then
    raise exception 'Email is not approved for this app';
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    approved_email.display_name,
    case when approved_email.is_admin then 'admin' else 'player' end
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_pick_updated_at on public.picks;
create trigger set_pick_updated_at
  before update on public.picks
  for each row execute procedure public.touch_updated_at();

drop trigger if exists set_result_updated_at on public.results;
create trigger set_result_updated_at
  before update on public.results
  for each row execute procedure public.touch_updated_at();

create or replace function public.recalculate_scores_for_race(target_race_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  result_row public.results;
  target_race public.races;
begin
  select *
  into target_race
  from public.races
  where id = target_race_id;

  select *
  into result_row
  from public.results
  where race_id = target_race_id;

  if result_row is null then
    raise exception 'Result not found for race %', target_race_id;
  end if;

  delete from public.scores where race_id = target_race_id;

  insert into public.scores (
    race_id,
    user_id,
    sprint_points,
    pole_points,
    podium_points,
    top10_points,
    race_points,
    cumulative_points
  )
  select
    p.race_id,
    p.user_id,
    (
      case
        when target_race.has_sprint and p.sprint_winner_driver_id = result_row.sprint_winner_driver_id then 2
        else 0
      end
      + case
        when target_race.has_sprint and p.sprint_second_driver_id = result_row.sprint_second_driver_id then 1
        else 0
      end
    ) as sprint_points,
    case when p.pole_driver_id = result_row.pole_driver_id then 2 else 0 end as pole_points,
    (
      select coalesce(sum(case
        when idx = 1 and p.top10_driver_ids[idx] = result_row.top10_driver_ids[idx] then 5
        when idx = 2 and p.top10_driver_ids[idx] = result_row.top10_driver_ids[idx] then 4
        when idx = 3 and p.top10_driver_ids[idx] = result_row.top10_driver_ids[idx] then 3
        else 0
      end), 0)
      from generate_subscripts(p.top10_driver_ids, 1) as idx
    ) as podium_points,
    (
      select coalesce(sum(case
        when p.top10_driver_ids[idx] = any(result_row.top10_driver_ids)
        then 1 else 0 end), 0)
      from generate_subscripts(p.top10_driver_ids, 1) as idx
    ) as top10_points,
    0,
    0
  from public.picks p
  where p.race_id = target_race_id;

  update public.scores
  set race_points = sprint_points + pole_points + podium_points + top10_points
  where race_id = target_race_id;

  with cumulative as (
    select
      s.id,
      sum(s2.race_points) as total_points
    from public.scores s
    join public.races r on r.id = s.race_id
    join public.scores s2 on s2.user_id = s.user_id
    join public.races r2 on r2.id = s2.race_id and r2.round_number <= r.round_number
    group by s.id
  )
  update public.scores score
  set cumulative_points = cumulative.total_points
  from cumulative
  where score.id = cumulative.id;

  update public.races
  set status = 'scored'
  where id = target_race_id;
end;
$$;

alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.races enable row level security;
alter table public.race_drivers enable row level security;
alter table public.drivers enable row level security;
alter table public.picks enable row level security;
alter table public.results enable row level security;
alter table public.scores enable row level security;

create policy "profiles readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "drivers readable by authenticated users"
  on public.drivers for select
  to authenticated
  using (true);

create policy "races readable by authenticated users"
  on public.races for select
  to authenticated
  using (true);

create policy "race drivers readable by authenticated users"
  on public.race_drivers for select
  to authenticated
  using (true);

create policy "results readable by authenticated users"
  on public.results for select
  to authenticated
  using (true);

create policy "scores readable by authenticated users"
  on public.scores for select
  to authenticated
  using (true);

create policy "users can read own picks before lock and all after lock"
  on public.picks for select
  to authenticated
  using (
    auth.uid() = user_id
    or timezone('utc', now()) >= (select lock_at from public.races where id = race_id)
  );

create policy "users can insert own picks before lock"
  on public.picks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and timezone('utc', now()) < (select lock_at from public.races where id = race_id)
  );

create policy "users can update own picks before lock"
  on public.picks for update
  to authenticated
  using (
    auth.uid() = user_id
    and timezone('utc', now()) < (select lock_at from public.races where id = race_id)
  )
  with check (
    auth.uid() = user_id
    and timezone('utc', now()) < (select lock_at from public.races where id = race_id)
  );

create policy "admins manage races"
  on public.races for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage race drivers"
  on public.race_drivers for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage results"
  on public.results for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins manage allowed emails"
  on public.allowed_emails for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

insert into public.drivers (id, code, full_name, team_name, team_color, car_number)
values
  ('albon', 'ALB', 'Alex Albon', 'Williams', '#005aff', 23),
  ('alonso', 'ALO', 'Fernando Alonso', 'Aston Martin', '#006f62', 14),
  ('antonelli', 'ANT', 'Kimi Antonelli', 'Mercedes', '#00d2be', 12),
  ('bearman', 'BEA', 'Oliver Bearman', 'Haas', '#b6babd', 87),
  ('bortoleto', 'BOR', 'Gabriel Bortoleto', 'Audi', '#ff2d00', 5),
  ('bottas', 'BOT', 'Valtteri Bottas', 'Cadillac', '#52e252', 77),
  ('colapinto', 'COL', 'Franco Colapinto', 'Alpine', '#0090ff', 43),
  ('gasly', 'GAS', 'Pierre Gasly', 'Alpine', '#0090ff', 10),
  ('hadjar', 'HAD', 'Isack Hadjar', 'Red Bull', '#3671c6', 6),
  ('hamilton', 'HAM', 'Lewis Hamilton', 'Ferrari', '#dc0000', 44),
  ('hulkenberg', 'HUL', 'Nico Hulkenberg', 'Audi', '#ff2d00', 27),
  ('lawson', 'LAW', 'Liam Lawson', 'Racing Bulls', '#6692ff', 30),
  ('leclerc', 'LEC', 'Charles Leclerc', 'Ferrari', '#dc0000', 16),
  ('lindblad', 'LIN', 'Arvid Lindblad', 'Racing Bulls', '#6692ff', 41),
  ('norris', 'NOR', 'Lando Norris', 'McLaren', '#ff8700', 1),
  ('ocon', 'OCO', 'Esteban Ocon', 'Haas', '#b6babd', 31),
  ('perez', 'PER', 'Sergio Perez', 'Cadillac', '#1e5bc6', 11),
  ('piastri', 'PIA', 'Oscar Piastri', 'McLaren', '#ff8700', 81),
  ('russell', 'RUS', 'George Russell', 'Mercedes', '#00d2be', 63),
  ('sainz', 'SAI', 'Carlos Sainz', 'Williams', '#005aff', 55),
  ('stroll', 'STR', 'Lance Stroll', 'Aston Martin', '#006f62', 18),
  ('verstappen', 'VER', 'Max Verstappen', 'Red Bull', '#3671c6', 3)
on conflict (id) do update
set
  code = excluded.code,
  full_name = excluded.full_name,
  team_name = excluded.team_name,
  team_color = excluded.team_color,
  car_number = excluded.car_number;

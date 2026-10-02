-- Applied to the "causvia" Supabase project (cdagxbuqvcsrbgynaarm) on 2026-10-02.

-- ============ access requests (early-access form) ============
create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text not null check (char_length(btrim(company)) between 1 and 160),
  role text not null check (role in ('Head of operations','Support leader','CX / quality','IT / engineering','Founder / executive','Other')),
  team_size text not null check (team_size in ('Under 50','50–200','200–1,000','1,000+')),
  workflow text not null check (workflow in ('Customer support','Claims','KYC / onboarding','Back office','Other')),
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at timestamptz not null default now()
);
comment on table public.access_requests is 'Early-access requests from causvia.com/auth. Insert-only from the browser; review in the dashboard.';

-- one pending request per email (the browser shows a friendly "already requested" message on conflict)
create unique index access_requests_one_pending_per_email on public.access_requests (lower(email)) where status = 'pending';

alter table public.access_requests enable row level security;
create policy "Anyone can request access" on public.access_requests
  for insert to anon, authenticated with check (status = 'pending');
-- no select/update/delete policies: requests can never be read or changed from the browser

-- the browser may only fill the form columns (status, id and created_at stay server-controlled)
revoke all on public.access_requests from anon, authenticated;
grant insert (name, email, company, role, team_size, workflow) on public.access_requests to anon, authenticated;

-- light server-side flood guard on top of the client-side rate limit
create or replace function public.access_requests_throttle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.access_requests where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Too many access requests right now. Try again in a minute.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.access_requests_throttle() from public, anon, authenticated;
create trigger access_requests_throttle before insert on public.access_requests
  for each row execute function public.access_requests_throttle();

-- ============ profiles (one per auth user; approval gate) ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per signed-up user. Only approved = true can enter /app. Approve with: select public.approve_user(''email'');';

alter table public.profiles enable row level security;
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
-- no insert/update/delete policies: rows come from the trigger below, approval is set by the Causvia team
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;

-- create a profile when someone signs up (invite, magic link, Google or Microsoft);
-- name and company fall back to their access request
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare req record;
begin
  select ar.name, ar.company into req from public.access_requests ar
    where lower(ar.email) = lower(new.email) order by ar.created_at desc limit 1;
  insert into public.profiles (id, full_name, company)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), req.name),
          coalesce(nullif(new.raw_user_meta_data ->> 'company', ''), req.company))
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ approval helper (run in the SQL editor; not callable from the browser) ============
create or replace function public.approve_user(user_email text) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid; req record;
begin
  select u.id into uid from auth.users u where lower(u.email) = lower(btrim(user_email));
  if uid is null then
    return 'No account yet for ' || user_email || '. Invite them first: Authentication > Users > Invite user.';
  end if;
  select ar.name, ar.company into req from public.access_requests ar
    where lower(ar.email) = lower(btrim(user_email)) order by ar.created_at desc limit 1;
  insert into public.profiles (id, full_name, company, approved) values (uid, req.name, req.company, true)
    on conflict (id) do update set approved = true,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      company = coalesce(public.profiles.company, excluded.company);
  update public.access_requests set status = 'approved' where lower(email) = lower(btrim(user_email)) and status = 'pending';
  return 'Approved ' || user_email;
end $$;
revoke execute on function public.approve_user(text) from public, anon, authenticated;

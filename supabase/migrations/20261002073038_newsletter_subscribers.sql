-- Applied to the "causvia" Supabase project (cdagxbuqvcsrbgynaarm) on 2026-10-02.

-- ============ "Get Causvia updates" sign-ups from the site footer ============
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source_page text check (source_page is null or char_length(source_page) <= 200),
  created_at timestamptz not null default now()
);
comment on table public.newsletter_subscribers is 'Footer "Get Causvia updates" sign-ups. Insert-only from the browser.';

-- one row per address, case-insensitive (the footer shows "You're already on the list." on conflict)
create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;
create policy "Anyone can subscribe" on public.newsletter_subscribers
  for insert to anon, authenticated with check (char_length(email) <= 254);
-- no select/update/delete policies: the list can never be read or changed from the browser

revoke all on public.newsletter_subscribers from anon, authenticated;
grant insert (email, source_page) on public.newsletter_subscribers to anon, authenticated;

-- light flood guard
create or replace function public.newsletter_throttle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.newsletter_subscribers where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Too many sign-ups right now. Try again in a minute.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.newsletter_throttle() from public, anon, authenticated;
create trigger newsletter_throttle before insert on public.newsletter_subscribers
  for each row execute function public.newsletter_throttle();

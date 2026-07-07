create table if not exists public.newsletter_subscribers (
    id bigserial primary key,
    email text not null unique,
    created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "service role manages newsletter subscribers" on public.newsletter_subscribers;
create policy "service role manages newsletter subscribers"
on public.newsletter_subscribers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

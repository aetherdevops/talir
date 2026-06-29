-- User profiles and synced app data for Talir

create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    created_at timestamptz not null default now()
);

create table if not exists public.user_alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade not null,
    symbol text not null,
    conditions jsonb not null default '[]'::jsonb,
    expiration jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    triggered_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.user_portfolios (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    currency text not null default 'MKD',
    created_at timestamptz not null default now()
);

create table if not exists public.user_holdings (
    id uuid primary key default gen_random_uuid(),
    portfolio_id uuid references public.user_portfolios on delete cascade not null,
    code text not null,
    quantity numeric not null,
    buy_price numeric not null,
    buy_date date not null,
    added_at timestamptz not null default now()
);

create table if not exists public.user_watchlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.user_watchlist_items (
    id uuid primary key default gen_random_uuid(),
    watchlist_id uuid references public.user_watchlists on delete cascade not null,
    code text not null,
    added_at timestamptz not null default now(),
    unique (watchlist_id, code)
);

alter table public.profiles enable row level security;
alter table public.user_alerts enable row level security;
alter table public.user_portfolios enable row level security;
alter table public.user_holdings enable row level security;
alter table public.user_watchlists enable row level security;
alter table public.user_watchlist_items enable row level security;

create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);

create policy "alerts_all_own" on public.user_alerts
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "portfolios_all_own" on public.user_portfolios
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "holdings_all_own" on public.user_holdings
    for all using (
        exists (
            select 1 from public.user_portfolios p
            where p.id = portfolio_id and p.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.user_portfolios p
            where p.id = portfolio_id and p.user_id = auth.uid()
        )
    );

create policy "watchlists_all_own" on public.user_watchlists
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "watchlist_items_all_own" on public.user_watchlist_items
    for all using (
        exists (
            select 1 from public.user_watchlists w
            where w.id = watchlist_id and w.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.user_watchlists w
            where w.id = watchlist_id and w.user_id = auth.uid()
        )
    );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do update set email = excluded.email;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create index if not exists user_alerts_user_id_idx on public.user_alerts (user_id);
create index if not exists user_portfolios_user_id_idx on public.user_portfolios (user_id);
create index if not exists user_watchlists_user_id_idx on public.user_watchlists (user_id);
create index if not exists user_holdings_portfolio_id_idx on public.user_holdings (portfolio_id);

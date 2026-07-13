-- Manual dividend field overrides (admin UI). Highest merge priority in generate:dividends.

create table if not exists public.dividend_overrides (
    id uuid primary key default gen_random_uuid(),
    stock_code text not null,
    profit_year int not null,
    fields jsonb not null default '{}'::jsonb,
    updated_by text,
    updated_at timestamptz not null default now(),
    unique (stock_code, profit_year)
);

create index if not exists idx_dividend_overrides_stock
    on public.dividend_overrides (stock_code);

-- Service-role scripts + authenticated admin server actions only (no anon policies).
alter table public.dividend_overrides enable row level security;

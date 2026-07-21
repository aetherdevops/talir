-- Macro observations (official SSO / NBRM / MoF series). Source of truth for generate:macro.

create table if not exists public.macro_series (
    id text primary key,
    label_en text not null,
    label_mk text not null,
    unit text not null check (unit in ('%', 'pp', 'index')),
    delta_unit text not null check (delta_unit in ('pp', '%', 'pts')),
    frequency text not null check (frequency in ('monthly', 'quarterly', 'annual')),
    category text not null default 'headline'
        check (category in ('headline', 'industry')),
    kpi_order int null,
    source_agency text not null,
    source_label text not null,
    source_url text,
    created_at timestamptz not null default now()
);

create table if not exists public.macro_observations (
    series_id text not null references public.macro_series (id) on delete cascade,
    obs_date date not null,
    value double precision not null,
    fetched_at timestamptz not null default now(),
    primary key (series_id, obs_date)
);

create index if not exists idx_macro_observations_date
    on public.macro_observations (obs_date desc);

create table if not exists public.macro_ingest_runs (
    id uuid primary key default gen_random_uuid(),
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    status text not null default 'running'
        check (status in ('running', 'ok', 'partial', 'error')),
    notes text,
    observation_count int not null default 0
);

alter table public.macro_series enable row level security;
alter table public.macro_observations enable row level security;
alter table public.macro_ingest_runs enable row level security;

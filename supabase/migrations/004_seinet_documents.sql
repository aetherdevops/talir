-- SECNet document ingestion store (service-role scripts / CI only)

create type public.document_kind as enum (
    'dividend_calendar',
    'audited_financial',
    'quarterly_pl'
);

create type public.document_parse_status as enum ('parsed', 'partial', 'link_only');

create table if not exists public.seinet_documents (
    document_id bigint primary key,
    stock_code text not null,
    layout_code text not null,
    document_kind public.document_kind not null,
    filed_at date not null,
    title text,
    url text not null,
    profit_year int,
    fiscal_year int,
    attachment_ids jsonb not null default '[]'::jsonb,
    is_current boolean not null default true,
    superseded_by bigint references public.seinet_documents (document_id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_seinet_documents_stock_kind
    on public.seinet_documents (stock_code, document_kind);

create index if not exists idx_seinet_documents_current_slot
    on public.seinet_documents (stock_code, document_kind, profit_year, fiscal_year)
    where is_current = true;

-- Parsed fields only — no PDF binaries or OCR text blobs (SECNet is source of truth).

create table if not exists public.document_field_extractions (
    id uuid primary key default gen_random_uuid(),
    document_id bigint not null references public.seinet_documents (document_id) on delete cascade,
    parser_version text not null,
    parse_status public.document_parse_status not null,
    fields jsonb not null default '{}'::jsonb,
    parse_errors jsonb,
    extracted_at timestamptz not null default now(),
    unique (document_id, parser_version)
);

create index if not exists idx_document_field_extractions_document
    on public.document_field_extractions (document_id);

-- No RLS: accessed only via service role from CI/scripts (never browser anon key).

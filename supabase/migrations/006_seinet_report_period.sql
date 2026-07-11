-- Distinguish quarterly/H1 slots within the same fiscal year

alter table public.seinet_documents
    add column if not exists report_period text;

drop index if exists public.idx_seinet_documents_current_slot;

create index if not exists idx_seinet_documents_current_slot
    on public.seinet_documents (stock_code, document_kind, profit_year, fiscal_year, report_period)
    where is_current = true;

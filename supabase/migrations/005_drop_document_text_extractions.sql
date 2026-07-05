-- Remove OCR text cache table if an earlier draft of 004 created it.
-- Parsed fields live in document_field_extractions; SECNet URLs are source of truth.

drop table if exists public.document_text_extractions;
drop type if exists public.text_extraction_source;

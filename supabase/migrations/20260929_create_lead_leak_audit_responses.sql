-- FluenceOS Lead Leak Audit
-- Standalone acquisition app. This table is intentionally separate from Pipeline OS product data.

create table if not exists public.lead_leak_audit_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  audit_session_id uuid not null,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  device_type text not null default 'unknown'
    check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),

  answers_json jsonb not null,
  primary_leak_category text,
  primary_type text not null
    check (primary_type in ('current_leak', 'no_significant_leak')),
  secondary_leak_category text,
  secondary_type text
    check (secondary_type is null or secondary_type in ('confirmed_leak', 'possible_underlying', 'watch_area')),
  confidence_state text not null
    check (confidence_state in ('normal', 'reduced', 'reinforced')),
  mixed_pattern boolean not null default false,
  result_variant text not null,
  score_breakdown_json jsonb not null,
  result_meta_json jsonb not null default '{}'::jsonb,
  reason_codes_json jsonb not null default '[]'::jsonb,
  completion_seconds integer
    check (completion_seconds is null or completion_seconds >= 0),

  cta_clicked boolean not null default false,
  cta_clicked_at timestamptz,
  cta_target text,
  cta_variant text
);

create index if not exists lead_leak_audit_responses_completed_at_idx
  on public.lead_leak_audit_responses (completed_at desc);

create index if not exists lead_leak_audit_responses_primary_category_idx
  on public.lead_leak_audit_responses (primary_leak_category);

create index if not exists lead_leak_audit_responses_utm_source_idx
  on public.lead_leak_audit_responses (utm_source);

create index if not exists lead_leak_audit_responses_audit_session_idx
  on public.lead_leak_audit_responses (audit_session_id);

alter table public.lead_leak_audit_responses enable row level security;

-- No anon/authenticated policies are created. The standalone Audit writes through
-- a server-only service-role client. Visitors never receive direct table access.
revoke all on table public.lead_leak_audit_responses from anon, authenticated;

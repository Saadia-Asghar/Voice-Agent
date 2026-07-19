create extension if not exists pgcrypto;

create type public.call_provenance as enum ('LIVE', 'RECORDED_LIVE_RUN', 'SIMULATED_FIXTURE');
create type public.call_outcome as enum ('quote', 'callback', 'declined', 'incomplete', 'failed');

create table public.service_scopes (
  id uuid primary key default gen_random_uuid(),
  version integer not null check (version > 0),
  canonical_hash text unique,
  specification jsonb not null,
  confirmation_status text not null check (confirmation_status in ('draft', 'needs_review', 'confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  negotiation_style text not null,
  is_consented_demo_counterparty boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id text unique,
  scope_id uuid not null references public.service_scopes(id),
  scope_hash text not null,
  provider_id uuid not null references public.providers(id),
  provenance public.call_provenance not null,
  lifecycle text not null default 'draft' check (lifecycle in ('draft','initiating','active','ending','awaiting_post_call','completed','failed')),
  outcome public.call_outcome,
  disclosure_handled boolean,
  transcript jsonb,
  analysis jsonb,
  has_audio boolean,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event_type text not null,
  conversation_id text,
  event_timestamp bigint not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls(id) on delete cascade,
  package_total numeric(12,2),
  itemized_terms jsonb not null default '{}'::jsonb,
  response_hours integer check (response_hours is null or response_hours >= 0),
  turnaround_hours integer check (turnaround_hours is null or turnaround_hours >= 0),
  warranty_days integer check (warranty_days is null or warranty_days >= 0),
  exclusions jsonb not null default '[]'::jsonb,
  unknowns jsonb not null default '[]'::jsonb,
  scope_match integer check (scope_match between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcript_evidence (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  field_name text not null,
  turn_index integer not null check (turn_index >= 0),
  excerpt text not null,
  created_at timestamptz not null default now(),
  unique (call_id, field_name, turn_index)
);

create table public.concessions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  field_name text not null,
  before_value jsonb not null,
  after_value jsonb not null,
  leverage_call_id uuid not null references public.calls(id),
  evidence_id uuid not null references public.transcript_evidence(id),
  created_at timestamptz not null default now(),
  check (call_id <> leverage_call_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls(id) on delete cascade,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index calls_scope_id_idx on public.calls (scope_id);
create index calls_provider_id_idx on public.calls (provider_id);
create index calls_lifecycle_created_at_idx on public.calls (lifecycle, created_at desc);
create index webhook_events_conversation_id_idx on public.webhook_events (conversation_id)
  where conversation_id is not null;
create index transcript_evidence_call_id_idx on public.transcript_evidence (call_id);
create index concessions_call_id_idx on public.concessions (call_id);
create index concessions_leverage_call_id_idx on public.concessions (leverage_call_id);
create index audit_events_call_id_created_at_idx on public.audit_events (call_id, created_at desc);

alter table public.service_scopes enable row level security;
alter table public.providers enable row level security;
alter table public.calls enable row level security;
alter table public.webhook_events enable row level security;
alter table public.quotes enable row level security;
alter table public.transcript_evidence enable row level security;
alter table public.concessions enable row level security;
alter table public.audit_events enable row level security;

-- Deliberately no browser policies: these records contain procurement evidence.
-- Writes and reads go through authenticated Edge Functions using the service role.
revoke all on public.service_scopes from anon, authenticated;
revoke all on public.providers from anon, authenticated;
revoke all on public.calls from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;
revoke all on public.quotes from anon, authenticated;
revoke all on public.transcript_evidence from anon, authenticated;
revoke all on public.concessions from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;

comment on table public.webhook_events is 'Server-only idempotency ledger for verified ElevenLabs webhooks.';

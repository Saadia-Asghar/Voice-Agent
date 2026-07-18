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

create index calls_scope_id_idx on public.calls (scope_id);
create index calls_provider_id_idx on public.calls (provider_id);
create index calls_lifecycle_created_at_idx on public.calls (lifecycle, created_at desc);
create index webhook_events_conversation_id_idx on public.webhook_events (conversation_id)
  where conversation_id is not null;

alter table public.service_scopes enable row level security;
alter table public.providers enable row level security;
alter table public.calls enable row level security;
alter table public.webhook_events enable row level security;

-- Deliberately no browser policies: these records contain procurement evidence.
-- Writes and reads go through authenticated Edge Functions using the service role.
revoke all on public.service_scopes from anon, authenticated;
revoke all on public.providers from anon, authenticated;
revoke all on public.calls from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;

comment on table public.webhook_events is 'Server-only idempotency ledger for verified ElevenLabs webhooks.';

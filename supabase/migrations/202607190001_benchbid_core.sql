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

alter table public.service_scopes enable row level security;
alter table public.providers enable row level security;
alter table public.calls enable row level security;
alter table public.webhook_events enable row level security;

comment on table public.webhook_events is 'Server-only idempotency ledger for verified ElevenLabs webhooks.';

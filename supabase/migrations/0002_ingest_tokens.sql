-- Lead finder token: only its sha256 is stored. No grants to anon/authenticated, so only the
-- service role (used inside the ingest-leads edge function) can read it.
create table if not exists outbound.ingest_tokens (
  token_sha256 text primary key check (token_sha256 ~ '^[0-9a-f]{64}$'),
  label text not null default 'lead-finder',
  created_at timestamptz not null default now()
);
alter table outbound.ingest_tokens enable row level security;
revoke all on outbound.ingest_tokens from anon, authenticated;
grant select on outbound.ingest_tokens to service_role;

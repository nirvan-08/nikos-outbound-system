-- Outbound sales data, kept in its own schema and locked to listed users only.
create schema if not exists outbound;

create table if not exists outbound.allowed_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists outbound.prospects (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists outbound.clients (like outbound.prospects including all);
create table if not exists outbound.meta (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function outbound.is_allowed() returns boolean
  language sql stable security definer set search_path = '' as
$$ select exists (select 1 from outbound.allowed_users where user_id = (select auth.uid())) $$;
revoke all on function outbound.is_allowed() from public, anon;
grant execute on function outbound.is_allowed() to authenticated;

alter table outbound.allowed_users enable row level security;
alter table outbound.prospects enable row level security;
alter table outbound.clients enable row level security;
alter table outbound.meta enable row level security;

create policy "own row" on outbound.allowed_users for select to authenticated using (user_id = (select auth.uid()));
create policy "allowed users" on outbound.prospects for all to authenticated using ((select outbound.is_allowed())) with check ((select outbound.is_allowed()));
create policy "allowed users" on outbound.clients for all to authenticated using ((select outbound.is_allowed())) with check ((select outbound.is_allowed()));
create policy "allowed users read" on outbound.meta for select to authenticated using ((select outbound.is_allowed()));

grant usage on schema outbound to authenticated, service_role;
revoke all on schema outbound from anon;
grant select, insert, update, delete on outbound.prospects, outbound.clients to authenticated;
grant select on outbound.meta, outbound.allowed_users to authenticated;
grant all on all tables in schema outbound to service_role;

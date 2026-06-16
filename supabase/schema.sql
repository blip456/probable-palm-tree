-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Creates the table used by the app to store messages keyed by passphrase.

create table if not exists public.messages (
  passphrase  text primary key,
  name        text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security. The app talks to Supabase from server-side API
-- routes using the SERVICE ROLE key, which bypasses RLS — so no public policies
-- are needed. With RLS on and no policies, the table is not readable/writable by
-- the anon/public key, which is what we want.
alter table public.messages enable row level security;

-- Grant the table privileges the app needs to the service_role. Tables created
-- via raw SQL do not always inherit these grants, which surfaces as
-- "permission denied for table messages" (SQLSTATE 42501) even though
-- service_role bypasses RLS. service_role needs INSERT (save) and SELECT (fetch).
grant usage on schema public to service_role;
grant select, insert on table public.messages to service_role;

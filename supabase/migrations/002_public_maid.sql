-- Public maid access via unguessable token (for QR codes)

alter table public.cleaning_sessions
add column if not exists public_token uuid not null default gen_random_uuid();

-- Public sessions are not tied to an authenticated user.
alter table public.cleaning_sessions
alter column started_by drop not null;

create unique index if not exists cleaning_sessions_public_token_uidx
on public.cleaning_sessions (public_token);


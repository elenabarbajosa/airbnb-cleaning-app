-- Airbnb cleaning checklist MVP schema (Supabase Postgres)

create extension if not exists "pgcrypto";

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'maid'))
);

alter table public.profiles enable row level security;

create policy "profiles: read self or admin"
on public.profiles
for select
using (id = auth.uid() or public.is_admin());

create policy "profiles: update self or admin"
on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- checklist template tasks
create table if not exists public.checklist_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_important boolean not null default false
);

create index if not exists checklist_tasks_sort_order_idx
on public.checklist_tasks (sort_order);

alter table public.checklist_tasks enable row level security;

create policy "checklist_tasks: read authenticated"
on public.checklist_tasks
for select
to authenticated
using (true);

create policy "checklist_tasks: write admin"
on public.checklist_tasks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- next cleaning note (single row is fine, but keep table flexible)
create table if not exists public.next_cleaning_note (
  id uuid primary key default gen_random_uuid(),
  note text not null default ''
);

alter table public.next_cleaning_note enable row level security;

create policy "next_note: read authenticated"
on public.next_cleaning_note
for select
to authenticated
using (true);

create policy "next_note: write admin"
on public.next_cleaning_note
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- cleaning sessions
create table if not exists public.cleaning_sessions (
  id uuid primary key default gen_random_uuid(),
  started_by uuid not null references auth.users(id),
  status text not null check (status in ('in_progress', 'completed')) default 'in_progress',
  eva_note text,
  maid_general_note text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists cleaning_sessions_started_at_idx
on public.cleaning_sessions (started_at desc);

create index if not exists cleaning_sessions_status_idx
on public.cleaning_sessions (status);

alter table public.cleaning_sessions enable row level security;

create policy "sessions: read own or admin"
on public.cleaning_sessions
for select
to authenticated
using (public.is_admin() or started_by = auth.uid());

create policy "sessions: insert self or admin"
on public.cleaning_sessions
for insert
to authenticated
with check (public.is_admin() or started_by = auth.uid());

create policy "sessions: update own or admin"
on public.cleaning_sessions
for update
to authenticated
using (public.is_admin() or started_by = auth.uid())
with check (public.is_admin() or started_by = auth.uid());

-- session tasks (copied snapshot of template at session start)
create table if not exists public.cleaning_session_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cleaning_sessions(id) on delete cascade,
  template_task_id uuid references public.checklist_tasks(id),
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_important boolean not null default false,
  is_completed boolean not null default false,
  completed_at timestamptz,
  issue_note text
);

create index if not exists session_tasks_session_id_sort_idx
on public.cleaning_session_tasks (session_id, sort_order);

alter table public.cleaning_session_tasks enable row level security;

create policy "session_tasks: read via session"
on public.cleaning_session_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.cleaning_sessions s
    where s.id = cleaning_session_tasks.session_id
      and (public.is_admin() or s.started_by = auth.uid())
  )
);

create policy "session_tasks: insert via session (self/admin)"
on public.cleaning_session_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.cleaning_sessions s
    where s.id = cleaning_session_tasks.session_id
      and (public.is_admin() or s.started_by = auth.uid())
  )
);

create policy "session_tasks: update via session (self/admin)"
on public.cleaning_session_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.cleaning_sessions s
    where s.id = cleaning_session_tasks.session_id
      and (public.is_admin() or s.started_by = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.cleaning_sessions s
    where s.id = cleaning_session_tasks.session_id
      and (public.is_admin() or s.started_by = auth.uid())
  )
);


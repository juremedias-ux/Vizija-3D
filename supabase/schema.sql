-- Tabela za nezavezujoče prijave zanimanja (Vizija 3D).
-- Spletno mesto jo ob prvi prijavi ustvari samodejno; to datoteko lahko
-- zaženeš tudi ročno v Supabase → SQL Editor. Enaki stavki so v
-- src/lib/server/postgres-repository.ts.

create table if not exists public.interest_submissions (
  id uuid primary key,
  product_id text not null,
  email text not null,
  quantity integer not null check (quantity between 1 and 99),
  status text not null default 'active'
    check (status in ('active', 'notified', 'withdrawn')),
  consent_at timestamptz not null,
  consent_text_version text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (product_id, email)
);

create index if not exists interest_submissions_email_idx
  on public.interest_submissions (email);

-- Brez pravil RLS do tabele ni dostopa prek javnega API-ja Supabase.
alter table public.interest_submissions enable row level security;

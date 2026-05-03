create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  is_used boolean not null default false,
  used_at timestamptz,
  tier int not null default 1 check (tier in (1, 2, 3)),
  created_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  scene text,
  tool text,
  tier int not null default 1 check (tier in (1, 2, 3)),
  tags text[] not null default '{}',
  source_url text,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint prompts_content_unique unique (content)
);

create table if not exists public.source_tracking (
  id uuid primary key default gen_random_uuid(),
  source_url text unique not null,
  source_type text check (source_type in ('github', 'website')),
  last_hash text,
  last_checked timestamptz,
  has_update boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  card_code text,
  user_input text,
  matched_prompt_id uuid references public.prompts(id) on delete set null,
  used_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cards_code_idx on public.cards (code);
create index if not exists prompts_tier_idx on public.prompts (tier);
create index if not exists prompts_tags_idx on public.prompts using gin (tags);
create index if not exists logs_card_code_idx on public.logs (card_code);

alter table public.cards enable row level security;
alter table public.prompts enable row level security;
alter table public.source_tracking enable row level security;
alter table public.logs enable row level security;

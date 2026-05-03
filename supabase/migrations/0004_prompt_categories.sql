alter table public.prompts
add column if not exists category_ids text[] not null default '{}';

create index if not exists prompts_category_ids_idx
on public.prompts using gin (category_ids);

alter table public.prompts
add column if not exists sample_media_urls text[] not null default '{}';

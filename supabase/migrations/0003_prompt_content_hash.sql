alter table public.prompts
drop constraint if exists prompts_content_unique;

alter table public.prompts
add column if not exists content_hash text
generated always as (encode(digest(content, 'sha256'), 'hex')) stored;

create unique index if not exists prompts_content_hash_unique
on public.prompts (content_hash);

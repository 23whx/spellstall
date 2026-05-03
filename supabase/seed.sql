insert into public.cards (code, tier)
values
  ('SPELL-TEST-BASIC', 1),
  ('SPELL-TEST-STANDARD', 2),
  ('SPELL-TEST-PRO', 3)
on conflict (code) do update
set
  tier = excluded.tier,
  is_used = false,
  used_at = null;

insert into public.source_tracking (source_url, source_type)
values
  ('https://github.com/freestylefly/awesome-gpt-image-2', 'github'),
  ('https://github.com/Anil-matcha/Awesome-GPT-Image-2-API-Prompts', 'github'),
  ('https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts', 'github'),
  ('https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts', 'github'),
  ('https://youmind.com/zh-CN/prompts', 'website'),
  ('https://opennana.com/awesome-prompt-gallery', 'website')
on conflict (source_url) do update
set
  source_type = excluded.source_type;

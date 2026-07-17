alter table public.campaign_daily_insights
  add column if not exists ctr numeric not null default 0,
  add column if not exists page_views numeric not null default 0,
  add column if not exists cpv numeric not null default 0,
  add column if not exists initiate_checkout numeric not null default 0;

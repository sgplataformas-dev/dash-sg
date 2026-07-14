alter table public.fb_account_daily_insights
  add column if not exists link_clicks numeric not null default 0,
  add column if not exists page_views numeric not null default 0,
  add column if not exists view_content numeric not null default 0,
  add column if not exists initiate_checkout numeric not null default 0;

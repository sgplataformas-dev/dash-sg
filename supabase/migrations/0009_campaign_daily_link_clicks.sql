alter table public.campaign_daily_insights add column if not exists link_clicks numeric not null default 0;

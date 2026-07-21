create table if not exists public.campaign_daily_insights (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  date date not null,
  spend numeric not null default 0,
  impressions numeric not null default 0,
  clicks numeric not null default 0,
  cpm numeric not null default 0,
  cpc numeric not null default 0,
  synced_at timestamptz not null default now(),
  unique (campaign_id, date)
);

create index if not exists campaign_daily_insights_date_idx on public.campaign_daily_insights (date);

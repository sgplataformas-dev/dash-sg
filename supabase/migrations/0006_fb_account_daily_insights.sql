create table if not exists public.fb_account_daily_insights (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  spend numeric not null default 0,
  impressions numeric not null default 0,
  clicks numeric not null default 0,
  cpm numeric not null default 0,
  cpc numeric not null default 0,
  ctr numeric not null default 0,
  reach numeric not null default 0,
  cpv numeric not null default 0,
  cpi numeric not null default 0,
  fb_purchases numeric not null default 0,
  synced_at timestamptz not null default now()
);

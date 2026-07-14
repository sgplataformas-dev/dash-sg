alter table public.campaigns add column if not exists cpv numeric, add column if not exists cpi numeric;

create table if not exists public.action_log (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  campaign_name text,
  action_taken text not null,
  observed_result text,
  created_at timestamptz not null default now()
);

alter table public.action_log enable row level security;

create policy action_log_select on public.action_log for select using (true);
create policy action_log_insert on public.action_log for insert with check (true);
create policy action_log_delete on public.action_log for delete using (true);

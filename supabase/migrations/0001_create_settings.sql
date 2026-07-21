create table if not exists settings (
  key text primary key,
  value text
);

alter table settings enable row level security;

create policy "settings_select" on settings
  for select using (true);

create policy "settings_upsert" on settings
  for insert with check (true);

create policy "settings_update" on settings
  for update using (true);

create policy "settings_delete" on settings
  for delete using (true);

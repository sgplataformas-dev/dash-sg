create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'sync-facebook-ads-every-30min',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://jayuivvpbhsfjpetfspa.supabase.co/functions/v1/sync-facebook-ads',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);

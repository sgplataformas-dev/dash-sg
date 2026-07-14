-- The webhook-payt function was using link.sources.src as ad_id, but that
-- field is not a Facebook ad ID. The real Facebook ad ID is embedded in
-- utm_content as "name|facebook_ad_id" (and similarly in utm_campaign /
-- utm_medium for campaign/adset). Fixed in the Edge Function to parse it
-- from utm_content instead.
--
-- This adds an UPDATE trigger so re-matching also fires when ad_id is
-- corrected on existing rows, then backfills the 86 sales that came in
-- before the fix.

create trigger on_sale_update_match_ad
  before update of ad_id, utm_content on public.sales
  for each row execute function match_sale_to_ad();

update public.sales
set ad_id = substring(utm_content from '\|(\d{10,})$')
where substring(utm_content from '\|(\d{10,})$') is not null;

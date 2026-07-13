-- Note: the `sales` table already existed in this project with a richer
-- schema (checkout_platform, amount, buyer_name, matched_ad_id/ad_set_id/
-- campaign_id FKs, match_sale_to_ad trigger, etc). These are the two
-- adjustments needed to receive Payt webhooks into it.

alter table public.sales drop constraint if exists sales_checkout_platform_check;
alter table public.sales add constraint sales_checkout_platform_check
  check (checkout_platform = any (array['hotmart'::text, 'kiwify'::text, 'kirvano'::text, 'payt'::text]));

alter table public.sales add constraint sales_transaction_id_unique unique (transaction_id);

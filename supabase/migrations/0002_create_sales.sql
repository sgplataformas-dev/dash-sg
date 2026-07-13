create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique not null,
  date timestamptz not null,
  product text not null,
  value numeric not null default 0,
  checkout text not null default 'Payt',
  campaign text,
  ad_set text,
  ad text,
  status text not null default 'pendente',
  type text not null default 'paga',
  customer_name text,
  customer_email text,
  raw jsonb,
  created_at timestamptz not null default now()
);

alter table sales enable row level security;

create policy "sales_select" on sales
  for select using (true);

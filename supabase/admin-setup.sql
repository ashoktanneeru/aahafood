create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.products (
  id text primary key,
  name text not null,
  price integer not null default 0,
  image text,
  images jsonb not null default '[]'::jsonb,
  videos jsonb not null default '[]'::jsonb,
  description text not null default '',
  category text not null,
  category_slug text not null,
  diet text not null default 'veg' check (diet in ('veg', 'non-veg')),
  sku text,
  inventory_count integer not null default 0,
  inventory_threshold integer not null default 5,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  name text not null,
  phone text not null,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  total_price integer not null default 0,
  status text not null default 'new' check (status in ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_mode text not null default 'whatsapp' check (payment_mode in ('whatsapp', 'razorpay')),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  referrer text,
  user_agent text,
  device text,
  event_type text not null default 'page_view',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_products_category_slug on public.products(category_slug);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_phone on public.orders(phone);
create index if not exists idx_visitor_events_created_at on public.visitor_events(created_at desc);
create index if not exists idx_visitor_events_session_id on public.visitor_events(session_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.visitor_events enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage products" on public.products;
create policy "Authenticated can manage products"
on public.products
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can review orders" on public.orders;
create policy "Authenticated can review orders"
on public.orders
for select
to authenticated
using (true);

drop policy if exists "Authenticated can update orders" on public.orders;
create policy "Authenticated can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Public can log visitor events" on public.visitor_events;
create policy "Public can log visitor events"
on public.visitor_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can read visitor events" on public.visitor_events;
create policy "Authenticated can read visitor events"
on public.visitor_events
for select
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view product media" on storage.objects;
create policy "Public can view product media"
on storage.objects
for select
using (bucket_id = 'product-media');

drop policy if exists "Authenticated can upload product media" on storage.objects;
create policy "Authenticated can upload product media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-media');

drop policy if exists "Authenticated can update product media" on storage.objects;
create policy "Authenticated can update product media"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-media')
with check (bucket_id = 'product-media');

drop policy if exists "Authenticated can delete product media" on storage.objects;
create policy "Authenticated can delete product media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-media');

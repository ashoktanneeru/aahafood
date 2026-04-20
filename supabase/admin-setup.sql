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

create table if not exists public.admin_users (
  user_id uuid primary key,
  email text not null,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active = true
  );
$$;

create table if not exists public.categories (
  slug text primary key,
  label text not null,
  description text not null default '',
  gradient text not null default 'linear-gradient(135deg, #2E7D32, #C9E21A)',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

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
  customer_email text,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  shipping integer not null default 0,
  total_price integer not null default 0,
  status text not null default 'new' check (status in ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_mode text not null default 'whatsapp' check (payment_mode in ('whatsapp', 'razorpay')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_verified_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists subtotal integer not null default 0;
alter table public.orders add column if not exists shipping integer not null default 0;
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists payment_verified_at timestamp with time zone;

update public.orders
set subtotal = total_price
where subtotal = 0 and total_price > 0;

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

create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_categories_display_order on public.categories(display_order, label);
create index if not exists idx_products_category_slug on public.products(category_slug);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_phone on public.orders(phone);
create unique index if not exists idx_orders_razorpay_order_id on public.orders(razorpay_order_id) where razorpay_order_id is not null;
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_visitor_events_created_at on public.visitor_events(created_at desc);
create index if not exists idx_visitor_events_session_id on public.visitor_events(session_id);

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.site_content enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.visitor_events enable row level security;

drop policy if exists "Authenticated can view own admin role" on public.admin_users;
create policy "Authenticated can view own admin role"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories"
on public.categories
for select
using (is_active = true or public.is_admin());

drop policy if exists "Authenticated can manage categories" on public.categories;
create policy "Authenticated can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can view homepage content" on public.site_content;
create policy "Public can view homepage content"
on public.site_content
for select
using (key = 'homepage' or public.is_admin());

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
on public.site_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
using (is_active = true or public.is_admin());

drop policy if exists "Authenticated can manage products" on public.products;
create policy "Authenticated can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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
using (public.is_admin());

drop policy if exists "Authenticated can update orders" on public.orders;
create policy "Authenticated can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

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
using (public.is_admin());

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
with check (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "Authenticated can update product media" on storage.objects;
create policy "Authenticated can update product media"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-media' and public.is_admin())
with check (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "Authenticated can delete product media" on storage.objects;
create policy "Authenticated can delete product media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-media' and public.is_admin());

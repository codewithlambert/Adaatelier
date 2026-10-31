-- =====================================================================
-- Ada Atelier: complete database for the shop + admin
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every object is created with IF NOT EXISTS / OR REPLACE.
-- =====================================================================

-- --------------a-------------------------------------------------------
-- 1. Staff (admin users) and role helpers
-- ---------------------------------------------------------------------
create table if not exists public.staff (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at  timestamptz not null default now()
);

-- security definer so policies can check roles without recursing into staff's own RLS
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where id = auth.uid());
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where id = auth.uid() and role = 'owner');
$$;

create or replace function public.can_manage() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where id = auth.uid() and role in ('owner', 'manager'));
$$;

-- keeps updated_at current on every update
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 2. Catalogue
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id           text primary key,                       -- slug, e.g. flap-bag-003
  name         text not null,
  category     text not null,
  price        numeric(10, 2) not null check (price >= 0),
  stock        integer not null default 0 check (stock >= 0),
  sold         integer not null default 0,
  status       text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  tagline      text not null default '',
  description  text not null default '',
  details      text[] not null default '{}',
  colors       text[] not null default '{onyx}',      -- onyx, cognac, bordeaux, forest, sand, silver
  image_url    text,                                   -- Storage URL; null = use the shop's bundled photo
  focus        text,                                   -- CSS object-position for the card crop
  is_new       boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- category list lives in a named constraint so new categories can be added on re-run
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('Backpack', 'Bucket Bag', 'Flap Bag', 'Shopper', 'Tote', 'Ankara', 'African Craft', 'Designer'));
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. Customers, orders, order items
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users (id) on delete set null,  -- for future shopper accounts
  name        text not null,
  email       text not null unique,
  phone       text,
  city        text,
  created_at  timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 3000;

create table if not exists public.orders (
  id              text primary key default ('ADA' || nextval('public.order_number_seq')),
  customer_id     uuid not null references public.customers (id) on delete restrict,
  status          text not null default 'pending'
                  check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  channel         text not null default 'Online store'
                  check (channel in ('Online store', 'Instagram', 'WhatsApp', 'Jumia', 'Point of sale')),
  payment_method  text not null default 'Paystack',
  payment_ref     text,
  subtotal        numeric(10, 2) not null default 0,
  discount        numeric(10, 2) not null default 0,
  discount_code   text,
  shipping        numeric(10, 2) not null default 0,
  total           numeric(10, 2) not null default 0,
  city            text,
  address         jsonb,
  tracking_ref    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- payments (Stripe for cards worldwide, Bachs for naira); set by the payment webhook only
alter table public.orders add column if not exists paid_at timestamptz;
-- order tracking: a secret per order for the shopper's tracking link, and when each step happened
alter table public.orders add column if not exists track_token uuid not null default gen_random_uuid();
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists confirmation_sent_at timestamptz;
-- optional note to this customer, shown on their tracking page under the current step
alter table public.orders add column if not exists status_note text;
-- what the payment page asked for (naira for Bachs, dollars for Stripe) and what actually arrived
alter table public.orders add column if not exists charge_currency text;
alter table public.orders add column if not exists charge_amount numeric(14, 2);
alter table public.orders add column if not exists paid_amount numeric(14, 2);
alter table public.orders add column if not exists currency text not null default 'USD';
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id            bigint generated always as identity primary key,
  order_id      text not null references public.orders (id) on delete cascade,
  product_id    text references public.products (id) on delete set null,
  product_name  text not null,
  color         text not null,
  qty           integer not null check (qty > 0),
  unit_price    numeric(10, 2) not null,
  monogram      text
);
alter table public.order_items add column if not exists monogram text;
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- 4. Discounts and campaigns
-- ---------------------------------------------------------------------
create table if not exists public.discounts (
  code         text primary key check (code = upper(code)),
  kind         text not null check (kind in ('percent', 'fixed', 'free_shipping')),
  amount       numeric(10, 2) not null default 0,
  used         integer not null default 0,
  usage_limit  integer not null default 100,
  expires_at   date,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  channel     text not null check (channel in ('Email', 'Instagram', 'WhatsApp', 'TikTok')),
  status      text not null default 'draft' check (status in ('active', 'scheduled', 'ended', 'draft')),
  reach       integer not null default 0,
  clicks      integer not null default 0,
  revenue     numeric(10, 2) not null default 0,
  ends_at     date,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Store settings: what the admin controls on the main site
-- ---------------------------------------------------------------------
create table if not exists public.store_settings (
  id                    integer primary key default 1 check (id = 1),   -- exactly one row
  maintenance           boolean not null default false,
  announcement_enabled  boolean not null default false,
  announcement          text not null default '',
  seo_title             text not null default 'Ada Atelier — Be Stylish & Modish',
  seo_description       text not null default 'Premium, durable bags made with the best materials.',
  standard_shipping     numeric(10, 2) not null default 6,
  express_shipping      numeric(10, 2) not null default 15,
  monogram_fee          numeric(10, 2) not null default 10,
  updated_at            timestamptz not null default now()
);
-- columns added after the first release (no-ops on a fresh database)
alter table public.store_settings add column if not exists monogram_fee numeric(10, 2) not null default 10;
-- shown on every tracking page while an order is being prepared (edited in Online store)
alter table public.store_settings add column if not exists preparing_note text not null
  default 'Checked, wrapped and boxed by hand';
drop trigger if exists settings_touch on public.store_settings;
create trigger settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. Notifications (streamed to the admin in real time)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('order', 'stock', 'system')),
  title       text not null,
  body        text not null default '',
  link        text,                         -- admin section, e.g. /#/orders
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);

-- ---------------------------------------------------------------------
-- 6b. Reviews (shoppers write, staff approve) and newsletter sign-ups
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  product_id  text not null references public.products (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  rating      smallint not null check (rating between 1 and 5),
  body        text not null check (char_length(body) between 1 and 1000),
  status      text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at  timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);

create table if not exists public.subscribers (
  email       text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source      text not null default 'footer',
  created_at  timestamptz not null default now()
);

-- tell the admin about new reviews waiting for approval
create or replace function public.notify_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (kind, title, body, link)
  values ('system', 'New ' || new.rating || '-star review to approve',
          new.name || ' on ' || new.product_id, '/#/reviews');
  return new;
end $$;
drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify after insert on public.reviews
  for each row execute function public.notify_review();

-- bundled bags the admin has archived or drafted (the shop can't read those rows directly)
create or replace function public.hidden_product_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select id from public.products where status <> 'active'
$$;
grant execute on function public.hidden_product_ids() to anon, authenticated;

-- low stock: notify once when a product drops under 5
create or replace function public.notify_low_stock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.stock < 5 and old.stock >= 5 then
    insert into public.notifications (kind, title, body, link)
    values ('stock',
            case when new.stock = 0 then new.name || ' sold out' else new.name || ' is running low' end,
            new.stock || ' left in stock',
            '/#/products');
  end if;
  return new;
end $$;
drop trigger if exists products_low_stock on public.products;
create trigger products_low_stock after update of stock on public.products
  for each row execute function public.notify_low_stock();

-- ---------------------------------------------------------------------
-- 7. Checkout: the only way the public can create an order.
--    Prices, stock and discounts come from the database, never the browser.
-- ---------------------------------------------------------------------
create or replace function public.place_order(
  p_customer       jsonb,                 -- {"name","email","phone","city","address":{...}}
  p_items          jsonb,                 -- [{"product_id","color","qty","monogram"?}]
  p_channel        text default 'Online store',
  p_payment_method text default 'Paystack',
  p_payment_ref    text default null,
  p_discount_code  text default null,
  p_express        boolean default false
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_customer  uuid;
  v_order     text;
  v_item      jsonb;
  v_prod      public.products%rowtype;
  v_disc      public.discounts%rowtype;
  v_settings  public.store_settings%rowtype;
  v_qty       integer;
  v_mono      text;
  v_unit      numeric(10, 2);
  v_sub       numeric(10, 2) := 0;
  v_off       numeric(10, 2) := 0;
  v_ship      numeric(10, 2);
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if coalesce(p_customer ->> 'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email is required';
  end if;
  -- only staff may record sales for channels other than the online store
  if p_channel <> 'Online store' and not public.is_staff() then
    raise exception 'Not allowed';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  if v_settings.maintenance and not public.is_staff() then
    raise exception 'The store is closed for maintenance';
  end if;
  v_ship := case when p_channel = 'Point of sale' then 0
                 when p_express then v_settings.express_shipping
                 else v_settings.standard_shipping end;

  insert into public.customers (name, email, phone, city)
  values (coalesce(nullif(p_customer ->> 'name', ''), 'Customer'),
          lower(p_customer ->> 'email'), p_customer ->> 'phone', p_customer ->> 'city')
  on conflict (email) do update
    set name  = excluded.name,
        phone = coalesce(excluded.phone, public.customers.phone),
        city  = coalesce(excluded.city, public.customers.city)
  returning id into v_customer;

  insert into public.orders (customer_id, channel, payment_method, payment_ref, city, address,
                             status)
  values (v_customer, p_channel, p_payment_method, p_payment_ref, p_customer ->> 'city',
          p_customer -> 'address',
          case when p_channel = 'Point of sale' then 'delivered' else 'pending' end)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item ->> 'qty')::integer, 1), 1);
    select * into v_prod from public.products
      where id = v_item ->> 'product_id' and status = 'active'
      for update;
    if not found then
      raise exception 'A bag in your order is no longer available';
    end if;
    if v_prod.stock < v_qty then
      raise exception '% has only % left', v_prod.name, v_prod.stock;
    end if;
    if not ((v_item ->> 'color') = any (v_prod.colors)) then
      raise exception '% is not offered in that colour', v_prod.name;
    end if;
    -- up to three letters for a hand-set monogram, priced from store settings
    v_mono := nullif(left(upper(regexp_replace(coalesce(v_item ->> 'monogram', ''), '[^A-Za-z.&]', '', 'g')), 3), '');
    v_unit := v_prod.price + case when v_mono is null then 0 else v_settings.monogram_fee end;
    insert into public.order_items (order_id, product_id, product_name, color, qty, unit_price, monogram)
    values (v_order, v_prod.id, v_prod.name, v_item ->> 'color', v_qty, v_unit, v_mono);
    update public.products set stock = stock - v_qty, sold = sold + v_qty where id = v_prod.id;
    v_sub := v_sub + v_unit * v_qty;
  end loop;

  if coalesce(p_discount_code, '') <> '' then
    select * into v_disc from public.discounts
      where code = upper(p_discount_code) and active and used < usage_limit
        and (expires_at is null or expires_at >= current_date)
      for update;
    if found then
      v_off := case v_disc.kind
                 when 'percent' then round(v_sub * v_disc.amount / 100, 2)
                 when 'fixed' then least(v_disc.amount, v_sub)
                 else 0 end;
      if v_disc.kind = 'free_shipping' then v_ship := 0; end if;
      update public.discounts set used = used + 1 where code = v_disc.code;
    end if;
  end if;

  update public.orders
     set subtotal = v_sub, discount = v_off, shipping = v_ship,
         total = v_sub - v_off + v_ship, discount_code = v_disc.code
   where id = v_order;

  insert into public.notifications (kind, title, body, link)
  values ('order',
          'New order ' || v_order || ' · $' || to_char(v_sub - v_off + v_ship, 'FM999,990.00'),
          coalesce(p_customer ->> 'name', 'A customer') || ' · ' || coalesce(p_customer ->> 'city', p_channel),
          '/#/orders');

  return v_order;
end $$;

revoke all on function public.place_order(jsonb, jsonb, text, text, text, text, boolean) from public;
grant execute on function public.place_order(jsonb, jsonb, text, text, text, text, boolean) to anon, authenticated;

-- stamp each step of the timeline the first time an order reaches it
create or replace function public.stamp_order_steps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'shipped' and new.shipped_at is null then new.shipped_at := now(); end if;
    if new.status = 'delivered' then
      new.delivered_at := coalesce(new.delivered_at, now());
      new.shipped_at := coalesce(new.shipped_at, new.delivered_at);
    end if;
    if new.status = 'cancelled' and new.cancelled_at is null then new.cancelled_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_stamp_steps on public.orders;
create trigger orders_stamp_steps before update on public.orders
  for each row execute function public.stamp_order_steps();

-- what the shopper's tracking page shows; only with the secret from their link or email
create or replace function public.track_order(p_id text, p_token uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'created_at', o.created_at,
    'paid_at', o.paid_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
    'cancelled_at', o.cancelled_at,
    'courier', o.courier,
    'tracking_ref', o.tracking_ref,
    'payment_method', o.payment_method,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'shipping', o.shipping,
    'total', o.total,
    'currency', o.currency,
    'paid_amount', o.paid_amount,
    'charge_currency', o.charge_currency,
    'charge_amount', o.charge_amount,
    'city', o.city,
    'name', c.name,
    'status_note', o.status_note,
    'preparing_note', (select s.preparing_note from public.store_settings s where s.id = 1),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', i.product_id, 'name', i.product_name, 'color', i.color,
        'qty', i.qty, 'unit_price', i.unit_price, 'monogram', i.monogram) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.id = p_id and o.track_token = p_token
$$;
revoke all on function public.track_order(text, uuid) from public;
grant execute on function public.track_order(text, uuid) to anon, authenticated;

-- "Track your order" form: order number + the email used at checkout gives back the tracking secret
create or replace function public.find_order(p_id text, p_email text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select o.track_token
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.id = upper(trim(p_id)) and lower(c.email) = lower(trim(p_email))
$$;
revoke all on function public.find_order(text, text) from public;
grant execute on function public.find_order(text, text) to anon, authenticated;

-- discount preview for the checkout page (no counts or internals exposed)
create or replace function public.check_discount(p_code text)
returns table (code text, kind text, amount numeric)
language sql stable security definer set search_path = '' as $$
  select d.code, d.kind, d.amount from public.discounts d
   where d.code = upper(p_code) and d.active and d.used < d.usage_limit
     and (d.expires_at is null or d.expires_at >= current_date);
$$;
grant execute on function public.check_discount(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Row-level security
-- ---------------------------------------------------------------------
alter table public.staff          enable row level security;
alter table public.products       enable row level security;
alter table public.customers      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.discounts      enable row level security;
alter table public.campaigns      enable row level security;
alter table public.store_settings enable row level security;
alter table public.notifications  enable row level security;
alter table public.reviews        enable row level security;
alter table public.subscribers    enable row level security;

-- reviews: anyone reads published ones and can submit one for approval; staff moderate
drop policy if exists "public reads published reviews" on public.reviews;
create policy "public reads published reviews" on public.reviews for select to anon, authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists "anyone submits a review" on public.reviews;
create policy "anyone submits a review" on public.reviews for insert to anon, authenticated
  with check (status = 'pending');
drop policy if exists "staff moderate reviews" on public.reviews;
create policy "staff moderate reviews" on public.reviews for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff delete reviews" on public.reviews;
create policy "staff delete reviews" on public.reviews for delete to authenticated
  using (public.is_staff());

-- newsletter: anyone can sign up; only staff can see the list
drop policy if exists "anyone subscribes" on public.subscribers;
create policy "anyone subscribes" on public.subscribers for insert to anon, authenticated
  with check (true);
drop policy if exists "staff read subscribers" on public.subscribers;
create policy "staff read subscribers" on public.subscribers for select to authenticated
  using (public.is_staff());
drop policy if exists "staff remove subscribers" on public.subscribers;
create policy "staff remove subscribers" on public.subscribers for delete to authenticated
  using (public.is_staff());

-- staff: everyone on the team can see the team; only owners change it
drop policy if exists "staff can read team" on public.staff;
create policy "staff can read team" on public.staff for select to authenticated using (public.is_staff());
drop policy if exists "owners manage team" on public.staff;
create policy "owners manage team" on public.staff for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- products: the public sees active pieces; staff see and edit everything
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products for select to anon, authenticated
  using (status = 'active' or public.is_staff());
drop policy if exists "staff write products" on public.products;
create policy "staff write products" on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- customers / orders / items: staff only (shoppers can read their own once accounts exist)
drop policy if exists "staff manage customers" on public.customers;
create policy "staff manage customers" on public.customers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "shoppers read own profile" on public.customers;
create policy "shoppers read own profile" on public.customers for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "staff manage orders" on public.orders;
create policy "staff manage orders" on public.orders for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "shoppers read own orders" on public.orders;
create policy "shoppers read own orders" on public.orders for select to authenticated
  using (customer_id in (select id from public.customers where user_id = auth.uid()));

drop policy if exists "staff manage order items" on public.order_items;
create policy "staff manage order items" on public.order_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "shoppers read own order items" on public.order_items;
create policy "shoppers read own order items" on public.order_items for select to authenticated
  using (order_id in (select o.id from public.orders o
                      join public.customers c on c.id = o.customer_id
                      where c.user_id = auth.uid()));

-- discounts and campaigns: staff only (shoppers validate codes through check_discount)
drop policy if exists "staff manage discounts" on public.discounts;
create policy "staff manage discounts" on public.discounts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff manage campaigns" on public.campaigns;
create policy "staff manage campaigns" on public.campaigns for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- store settings: anyone can read (the shop needs them); owners and managers change them
drop policy if exists "public reads settings" on public.store_settings;
create policy "public reads settings" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "managers update settings" on public.store_settings;
create policy "managers update settings" on public.store_settings for update to authenticated
  using (public.can_manage()) with check (public.can_manage());

-- notifications: staff read them and mark them read
drop policy if exists "staff read notifications" on public.notifications;
create policy "staff read notifications" on public.notifications for select to authenticated using (public.is_staff());
drop policy if exists "staff mark notifications" on public.notifications;
create policy "staff mark notifications" on public.notifications for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- 9. Realtime: the admin subscribes to these
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['orders', 'notifications', 'products', 'store_settings', 'reviews', 'subscribers', 'discounts'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 10. Storage: product photos (public to view, staff to upload)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "public views product images" on storage.objects;
create policy "public views product images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
drop policy if exists "staff upload product images" on storage.objects;
create policy "staff upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());
drop policy if exists "staff change product images" on storage.objects;
create policy "staff change product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff());
drop policy if exists "staff delete product images" on storage.objects;
create policy "staff delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

-- ---------------------------------------------------------------------
-- 11. Starting data (skipped if rows already exist)
-- ---------------------------------------------------------------------
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

insert into public.products (id, name, category, price, stock, sold, status, tagline, description, details, colors, focus, is_new, sort_order) values
  ('flap-bag-001', 'Flap Bag No. 001', 'Flap Bag', 245, 42, 188, 'active', 'Silver flap, onyx body, chain strap.',
   'A compact evening bag with a metallic flap and a polished push-lock. The chain strap drops to the hip or doubles up for the shoulder.',
   '{"Metallic coated leather flap","Smooth onyx body","Detachable chain strap","W 22 × H 15 × D 7 cm"}', '{onyx,silver,bordeaux}', null, true, 1),
  ('shopper-002', 'Shopper No. 002', 'Shopper', 145, 8, 162, 'active', 'Heavy canvas for every day.',
   'Our everyday canvas shopper, cut from a dense cotton weave that keeps its shape when full and folds flat when empty.',
   '{"Heavyweight cotton canvas","Reinforced X-stitched handles","Fits a 14-inch laptop","W 38 × H 42 cm"}', '{onyx,sand,forest}', null, true, 2),
  ('flap-bag-003', 'Flap Bag No. 003', 'Flap Bag', 295, 27, 271, 'active', 'The one from the Surprise Box.',
   'A rounded saddle-flap in smooth leather with a brushed-gold push-lock and an adjustable tan strap. Our signature piece.',
   '{"Smooth calf-grain leather","Brushed-gold hardware","Adjustable tan strap","W 26 × H 18 × D 8 cm"}', '{onyx,cognac,bordeaux,sand}', null, false, 3),
  ('tote-004', 'Tote No. 004', 'Tote', 345, 12, 214, 'active', 'Structured leather, open top.',
   'A clean-lined leather tote with angled side panels and long handles that sit comfortably on the shoulder.',
   '{"Full-grain leather","Angled side gussets","Interior slip pocket","W 34 × H 28 × D 14 cm"}', '{onyx,cognac}', '50% 70%', false, 4),
  ('backpack-005', 'Backpack No. 005', 'Backpack', 265, 15, 97, 'active', 'Water-resistant nylon, tonal zips.',
   'A minimal daypack in water-resistant nylon with a padded laptop sleeve and tonal matte zips that disappear into the body.',
   '{"Water-resistant nylon","Padded 15-inch laptop sleeve","Front zip pocket","Capacity 18 L"}', '{onyx,forest}', null, false, 5),
  ('ankara-shopper-006', 'Ankara Shopper No. 006', 'Ankara', 165, 18, 0, 'active', 'Indigo wax print, sun rings in mustard and teal.',
   'Our everyday shopper in a heavy cotton wax print, the kind sold by the bolt in Lagos markets. Each panel is cut by hand, so the rings fall a little differently on every bag.',
   '{"100% cotton wax print, lined in canvas","Handmade in Lagos, Nigeria","Reinforced handles, fits a 14-inch laptop","W 38 × H 42 cm"}', '{onyx}', null, true, 6),
  ('ankara-tote-007', 'Ankara Tote No. 007', 'Ankara', 325, 10, 0, 'active', 'Plum print with nested diamonds, leather trim.',
   'The structured tote, wrapped in a plum wax print of nested diamonds and finished with leather edges. Bold enough for the weekend, neat enough for the office.',
   '{"Cotton wax print over a leather base","Handmade in Lagos, Nigeria","Angled side gussets, interior slip pocket","W 34 × H 28 × D 14 cm"}', '{onyx}', '50% 70%', true, 7),
  ('ankara-saddle-008', 'Ankara Saddle No. 008', 'Ankara', 285, 12, 0, 'active', 'Rainbow fans on cream, tan leather strap.',
   'Our signature saddle flap, made in a cream wax print of stacked fans. The tan strap and brushed-gold lock keep it grown-up.',
   '{"Cotton wax print, smooth leather trim","Handmade in Lagos, Nigeria","Adjustable tan strap, brushed-gold lock","W 26 × H 18 × D 8 cm"}', '{onyx}', null, false, 8),
  ('mudcloth-backpack-009', 'Mud Cloth Backpack No. 009', 'African Craft', 310, 6, 0, 'active', 'Hand-painted mud cloth from Mali.',
   'A daypack faced in bògòlanfini, the cotton cloth Malian artisans dye with leaves and paint with fermented river mud. No two bolts match, so no two bags do either.',
   '{"Hand-dyed cotton mud cloth, nylon lining","Cloth from Mali, sewn in Lagos","Padded 15-inch laptop sleeve","Capacity 18 L"}', '{onyx}', null, false, 9)
on conflict (id) do nothing;

-- demo bags that still carry their first launch prices move to the premium ones
-- (a price you've changed in the admin is left alone)
update public.products p set price = v.new_price
  from (values ('flap-bag-001', 30.99, 245), ('shopper-002', 24.99, 145), ('flap-bag-003', 34.99, 295),
               ('tote-004', 39.99, 345), ('backpack-005', 49.99, 265), ('ankara-shopper-006', 64, 165),
               ('ankara-tote-007', 89, 325), ('ankara-saddle-008', 79, 285),
               ('mudcloth-backpack-009', 98, 310)) as v (id, old_price, new_price)
 where p.id = v.id and p.price = v.old_price;

insert into public.reviews (product_id, name, rating, body, status)
select v.* from (values
  ('ankara-tote-007', 'Temi A.', 5, 'The print is even better in person and the leather base feels solid. Got stopped twice on the subway.', 'published'),
  ('ankara-tote-007', 'Danielle R.', 5, 'Arrived in Houston in six days, beautifully wrapped. Fits my laptop and lunch.', 'published'),
  ('ankara-shopper-006', 'Chioma O.', 4, 'Lovely heavy cotton and the colours are rich. I wish it had an inside zip pocket.', 'published'),
  ('flap-bag-003', 'Morgan L.', 5, 'Simple, well made and the strap length is perfect for crossbody.', 'published'),
  ('mudcloth-backpack-009', 'Kwame B.', 5, 'You can see the hand painting up close. Easily my favourite bag.', 'published')
) as v (product_id, name, rating, body, status)
where not exists (select 1 from public.reviews);

insert into public.discounts (code, kind, amount, used, usage_limit, expires_at, active) values
  ('ADA10', 'percent', 10, 0, 500, null, true),
  ('WELCOME15', 'percent', 15, 0, 1000, null, true),
  ('SHIPFREE', 'free_shipping', 0, 0, 600, null, false)
on conflict (code) do nothing;

-- =====================================================================
-- AFTER RUNNING: make yourself the owner
--   1. Authentication → Users → Add user → your email + a strong password
--      (tick "Auto confirm user").
--   2. Run this, with your email:
--
--   insert into public.staff (id, full_name, role)
--   select id, 'Ada', 'owner' from auth.users where email = 'you@example.com'
--   on conflict (id) do update set role = 'owner';
--
--   3. Authentication → Sign In / Providers → turn OFF "Allow new users to sign up"
--      so only people you add can log in.
-- =====================================================================

create extension if not exists "pgcrypto";

create type category_type as enum ('Offline', 'Virtual');
create type payment_status_type as enum ('pending', 'verified', 'rejected');
create type shipping_status_type as enum ('not_shipped', 'shipped');
create type run_status_type as enum ('not_uploaded', 'review', 'approved', 'rejected');

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  participant_token uuid not null unique default gen_random_uuid(),
  category category_type not null,
  full_name text not null,
  email text not null,
  phone text not null,
  birth_date date not null,
  gender text not null,
  domicile_city text not null,
  emergency_name text,
  emergency_phone text,
  emergency_relation text,
  running_app_account text,
  shirt_size text not null,
  address text not null,
  village text not null,
  district text not null,
  city_regency text not null,
  province text not null,
  postal_code text not null,
  address_notes text,
  payment_proof_url text,
  payment_status payment_status_type not null default 'pending',
  bib_number text unique,
  tracking_number text,
  shipping_status shipping_status_type not null default 'not_shipped',
  run_status run_status_type not null default 'not_uploaded'
);

create index if not exists registrations_category_idx on registrations(category);
create index if not exists registrations_payment_status_idx on registrations(payment_status);
create index if not exists registrations_email_idx on registrations(email);
create index if not exists registrations_token_idx on registrations(participant_token);

create table if not exists run_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  registration_id uuid not null references registrations(id) on delete cascade,
  run_date date not null,
  distance text not null,
  duration_pace text not null,
  app_name text not null,
  activity_link text,
  proof_url text,
  notes text,
  status run_status_type not null default 'review'
);

create index if not exists run_submissions_registration_id_idx on run_submissions(registration_id);
create index if not exists run_submissions_status_idx on run_submissions(status);

create table if not exists event_settings (
  id int primary key default 1,
  event_name text not null default 'HY Birthday Run 58',
  contact_email text not null default 'hybirthdayrun@gmail.com',
  account_holder text not null default 'MUHAMMAD HANIEF YUHADIAN',
  bank_name text default 'MANDIRI',
  bank_account_number text default '133.00.1078170.6',
  offline_price int not null default 325000,
  virtual_price int not null default 275000,
  shipping_fee int not null default 15000,
  offline_quota int not null default 325,
  virtual_quota int not null default 75,
  registration_opens_at timestamptz not null default '2026-07-07 00:00:00+07',
  registration_closes_at timestamptz not null default '2026-07-31 23:59:59+07',
  constraint singleton_settings check (id = 1)
);

insert into event_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  logo_url text,
  website_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

insert into storage.buckets (id, name, public)
values ('event-uploads', 'event-uploads', true)
on conflict (id) do nothing;

alter table registrations enable row level security;
alter table run_submissions enable row level security;
alter table event_settings enable row level security;
alter table sponsors enable row level security;

create policy "public can read visible sponsors"
on sponsors for select
using (is_visible = true);

create policy "public can read event settings"
on event_settings for select
using (true);

create policy "public can read event upload files"
on storage.objects for select
using (bucket_id = 'event-uploads');

-- The app writes registrations, admin changes, and uploads using SUPABASE_SERVICE_ROLE_KEY
-- from server-side Next.js API routes. Do not expose service role keys in the browser.

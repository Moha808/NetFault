-- ============================================================
-- Network Fault Reporting and Resolution Management System
-- Supabase schema: two roles (user, admin) — no technician tier
-- ============================================================

-- 1. Enums -----------------------------------------------------
create type user_role as enum ('user', 'admin');
create type fault_priority as enum ('Low', 'Medium', 'High', 'Critical');
create type fault_status as enum ('Pending', 'In Progress', 'Resolved', 'Closed');
create type fault_category as enum (
  'Internet Connection', 'Wi-Fi', 'Router', 'Switch', 'Server',
  'Firewall', 'Cable', 'DNS', 'IP Conflict', 'Slow Network',
  'Printer Network', 'Other'
);

-- 2. Profiles (extends auth.users) ------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'user',
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed User'),
    new.email,
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Fault categories (admin-manageable list, seeded from enum) --
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (name) values
  ('Internet Connection'), ('Wi-Fi'), ('Router'), ('Switch'), ('Server'),
  ('Firewall'), ('Cable'), ('DNS'), ('IP Conflict'), ('Slow Network'),
  ('Printer Network'), ('Other');

-- 4. Fault reports ------------------------------------------------
create sequence public.ticket_seq start 1000;

create table public.fault_reports (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('FR-' || nextval('public.ticket_seq')::text),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null references public.categories(name),
  location text not null,
  priority fault_priority not null default 'Medium',
  status fault_status not null default 'Pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fault_reports_updated_at
  before update on public.fault_reports
  for each row execute procedure public.set_updated_at();

-- 5. Fault updates (status/notes history log, admin-authored) ----
create table public.fault_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.fault_reports(id) on delete cascade,
  admin_id uuid references public.profiles(id),
  message text not null,
  status fault_status not null,
  created_at timestamptz not null default now()
);

-- 6. Indexes -------------------------------------------------------
create index idx_fault_reports_user_id on public.fault_reports(user_id);
create index idx_fault_reports_status on public.fault_reports(status);
create index idx_fault_updates_report_id on public.fault_updates(report_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.fault_reports enable row level security;
alter table public.fault_updates enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- profiles ---------------------------------------------------------
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin());

-- categories ---------------------------------------------------------
create policy "Anyone authenticated can view categories" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage categories" on public.categories
  for all using (public.is_admin());

-- fault_reports ---------------------------------------------------------
create policy "Users can view own reports" on public.fault_reports
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can create own reports" on public.fault_reports
  for insert with check (auth.uid() = user_id);

create policy "Admins can update any report" on public.fault_reports
  for update using (public.is_admin());

create policy "Admins can delete reports" on public.fault_reports
  for delete using (public.is_admin());

-- fault_updates ---------------------------------------------------------
create policy "Users can view updates on own reports" on public.fault_updates
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.fault_reports
      where fault_reports.id = fault_updates.report_id
      and fault_reports.user_id = auth.uid()
    )
  );

create policy "Admins can create updates" on public.fault_updates
  for insert with check (public.is_admin());

-- ============================================================
-- Seed an admin (run manually after your first signup):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================

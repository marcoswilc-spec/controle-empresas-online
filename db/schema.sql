create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'trial',
  status text not null default 'active',
  credits_balance numeric(12,2) not null default 0,
  credits_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'operator',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  cnpj text,
  internal_code text,
  tax_regime text default 'Simples Nacional',
  activity text,
  status text not null default 'active',
  client_since date,
  blocked boolean not null default false,
  block_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists obligations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  area text not null default 'Fiscal',
  frequency text not null default 'Mensal',
  due_day integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  obligation_id uuid references obligations(id) on delete set null,
  competence text not null,
  title text not null,
  status text not null default 'pending',
  responsible text,
  due_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  department text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  provider text not null default 'mercado_pago',
  provider_reference text,
  amount numeric(12,2) not null,
  credits_days integer not null default 30,
  status text not null default 'created',
  checkout_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_org on users(organization_id);
create index if not exists idx_companies_org on companies(organization_id);
create index if not exists idx_tasks_org_status on tasks(organization_id,status);
create index if not exists idx_tasks_company on tasks(company_id);

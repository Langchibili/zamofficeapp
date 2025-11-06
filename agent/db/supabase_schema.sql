-- Enable required extensions
create extension if not exists pgcrypto;

-- Agents: one per authenticated user
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  agent_code text not null unique,
  created_at timestamptz not null default now()
);

-- Companies (minimal; integrate with existing if present)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  agent_user_id uuid references auth.users(id)
);

-- Print jobs (source of commissions)
create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_date timestamptz not null default now(),
  pages integer not null check (pages >= 0),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null check (status in ('completed','cancelled','refunded','pending')) default 'completed',
  agent_user_id uuid references auth.users(id)
);

-- Withdrawals requested by agents
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  status text not null check (status in ('pending','approved','rejected','paid')) default 'pending',
  created_at timestamptz not null default now()
);

-- Commission configuration (flat rate for simplicity)
create table if not exists public.commission_settings (
  id int primary key default 1,
  rate numeric(5,4) not null check (rate >= 0 and rate <= 1)
);
insert into public.commission_settings (id, rate)
  values (1, 0.10)
  on conflict (id) do nothing;

-- View: commission per job with computed commission
create or replace view public.agent_commissions_view as
select
  j.id as job_id,
  j.agent_user_id,
  c.name as company_name,
  j.job_date,
  j.pages,
  j.amount,
  round(j.amount * (select rate from commission_settings limit 1), 2) as commission_amount,
  j.status
from public.print_jobs j
left join public.companies c on c.id = j.company_id
where j.status = 'completed' and j.agent_user_id is not null;

-- View: referred companies with metrics
create or replace view public.referred_companies_view as
select
  c.id as company_id,
  c.name as company_name,
  c.agent_user_id,
  count(j.id) as jobs_count,
  coalesce(sum(j.pages),0) as pages,
  coalesce(sum(j.amount),0) as total_spend,
  max(j.job_date) as last_job_at
from public.companies c
left join public.print_jobs j on j.company_id = c.id and j.status = 'completed'
where c.agent_user_id is not null
group by c.id, c.name, c.agent_user_id;

-- Function: agent metrics
create or replace function public.agent_metrics(p_user_id uuid)
returns table (
  referred_companies int,
  active_companies int,
  total_jobs int,
  total_pages int,
  total_commission numeric
) language sql stable as $$
  select
    (select count(*) from public.companies c where c.agent_user_id = p_user_id) as referred_companies,
    (select count(*) from public.referred_companies_view v where v.agent_user_id = p_user_id and v.jobs_count > 0) as active_companies,
    (select count(*) from public.print_jobs j where j.agent_user_id = p_user_id and j.status = 'completed') as total_jobs,
    coalesce((select sum(j.pages) from public.print_jobs j where j.agent_user_id = p_user_id and j.status = 'completed'),0)::int as total_pages,
    coalesce((select sum(round(j.amount * (select rate from commission_settings limit 1), 2)) from public.print_jobs j where j.agent_user_id = p_user_id and j.status = 'completed'),0) as total_commission;
$$;

-- Function: available balance
create or replace function public.agent_balance(p_user_id uuid)
returns numeric language sql stable as $$
  with earned as (
    select coalesce(sum(round(j.amount * (select rate from commission_settings limit 1), 2)),0) as total
    from public.print_jobs j
    where j.agent_user_id = p_user_id and j.status = 'completed'
  ),
  withdrawn as (
    select coalesce(sum(w.amount),0) as total
    from public.withdrawals w
    where w.user_id = p_user_id and w.status in ('pending','approved','paid')
  )
  select (select total from earned) - (select total from withdrawn);
$$;

-- RLS
alter table public.agents enable row level security;
alter table public.withdrawals enable row level security;
alter table public.companies enable row level security;
alter table public.print_jobs enable row level security;

-- Policies: agents
create policy if not exists agents_select_self on public.agents
  for select using (auth.uid() = user_id);
create policy if not exists agents_insert_self on public.agents
  for insert with check (auth.uid() = user_id);

-- Policies: withdrawals
create policy if not exists withdrawals_select_own on public.withdrawals
  for select using (auth.uid() = user_id);
create policy if not exists withdrawals_insert_own on public.withdrawals
  for insert with check (auth.uid() = user_id);

-- Policies: companies
create policy if not exists companies_select_all on public.companies
  for select using (true);
create policy if not exists companies_insert_agent on public.companies
  for insert with check (auth.uid() = agent_user_id);

-- Policies: print_jobs
create policy if not exists print_jobs_select_all on public.print_jobs
  for select using (true);
create policy if not exists print_jobs_insert_agent on public.print_jobs
  for insert with check (agent_user_id is null or auth.uid() = agent_user_id);

-- Grant view/function access
grant usage on schema public to anon, authenticated;
grant select on public.agent_commissions_view, public.referred_companies_view to anon, authenticated;
grant execute on function public.agent_metrics(uuid) to anon, authenticated;
grant execute on function public.agent_balance(uuid) to anon, authenticated;

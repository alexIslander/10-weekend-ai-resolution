create extension if not exists "uuid-ossp";

create table if not exists reveals (
  id uuid primary key default uuid_generate_v4(),
  purchaser_email text not null,
  purchaser_user_id uuid,
  name text,
  status text not null check (status in ('draft', 'awaiting', 'completed')),
  respondent_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists reveals_email_idx on reveals (purchaser_email);
create index if not exists reveals_status_idx on reveals (status);

create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  prompt text not null,
  sort_order int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default uuid_generate_v4(),
  reveal_id uuid not null references reveals(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  unique (reveal_id, question_id)
);

create index if not exists answers_reveal_idx on answers (reveal_id);

create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  percent_off int not null check (percent_off between 0 and 100),
  active boolean not null default true,
  expires_at timestamptz,
  max_redemptions int,
  redemptions int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coupon_attempts (
  id uuid primary key default uuid_generate_v4(),
  attempt_key text not null unique,
  attempts int not null default 0,
  cooldown_until timestamptz,
  banned_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_user_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_questions_updated_at
before update on questions
for each row execute function set_updated_at();

create trigger set_coupons_updated_at
before update on coupons
for each row execute function set_updated_at();

create trigger set_feature_flags_updated_at
before update on feature_flags
for each row execute function set_updated_at();

alter table reveals enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table coupons enable row level security;
alter table coupon_attempts enable row level security;
alter table feature_flags enable row level security;
alter table admin_audit_logs enable row level security;

create policy "reveal_owner_select"
  on reveals for select
  using (auth.uid() = purchaser_user_id);

create policy "reveal_owner_update"
  on reveals for update
  using (auth.uid() = purchaser_user_id);

create policy "question_read_all"
  on questions for select
  using (true);

create policy "answers_owner_select"
  on answers for select
  using (
    exists (
      select 1 from reveals
      where reveals.id = answers.reveal_id
        and reveals.purchaser_user_id = auth.uid()
    )
  );

create policy "feature_flags_admin_only"
  on feature_flags for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "coupons_admin_only"
  on coupons for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "coupon_attempts_admin_only"
  on coupon_attempts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "admin_audit_admin_only"
  on admin_audit_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

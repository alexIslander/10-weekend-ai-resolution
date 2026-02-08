create table if not exists feedback (
  id uuid primary key default uuid_generate_v4(),
  reveal_id uuid not null references reveals(id) on delete cascade,
  source text not null,
  rating boolean not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_reveal_idx on feedback (reveal_id);

alter table feedback enable row level security;

create policy "feedback_admin_only"
  on feedback for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

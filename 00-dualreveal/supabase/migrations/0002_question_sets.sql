create table if not exists question_sets (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  title text not null,
  description text not null,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists question_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table questions
  add column if not exists question_set_id uuid references question_sets(id),
  add column if not exists answer_type text;

update questions
  set answer_type = 'text'
  where answer_type is null;

alter table reveals
  add column if not exists question_set_id uuid references question_sets(id),
  add column if not exists quiz_started_at timestamptz,
  add column if not exists quiz_locked_by text;

alter table answers
  add column if not exists selected_option_id uuid references question_options(id);

create index if not exists questions_set_idx on questions (question_set_id);
create index if not exists question_options_question_idx on question_options (question_id);
create index if not exists reveals_question_set_idx on reveals (question_set_id);

create trigger set_question_sets_updated_at
before update on question_sets
for each row execute function set_updated_at();

create trigger set_question_options_updated_at
before update on question_options
for each row execute function set_updated_at();

alter table question_sets enable row level security;
alter table question_options enable row level security;

create policy "question_sets_read_all"
  on question_sets for select
  using (true);

create policy "question_options_read_all"
  on question_options for select
  using (true);

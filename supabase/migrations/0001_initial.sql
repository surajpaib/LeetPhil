create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  track text not null check (track in ('identity', 'ethics', 'knowledge')),
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  estimated_minutes integer not null check (estimated_minutes between 5 and 90),
  prompt text not null,
  context text not null,
  rubric_notes text[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete restrict,
  answer text not null,
  status text not null default 'draft' check (status in ('draft', 'evaluated', 'failed')),
  word_count integer not null check (word_count between 0 and 2000),
  evaluation_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete restrict,
  clarity numeric(4, 2) not null check (clarity between 0 and 10),
  argument_quality numeric(4, 2) not null check (argument_quality between 0 and 10),
  counterargument numeric(4, 2) not null check (counterargument between 0 and 10),
  conceptual_depth numeric(4, 2) not null check (conceptual_depth between 0 and 10),
  prompt_fit numeric(4, 2) not null check (prompt_fit between 0 and 10),
  overall_score numeric(4, 2) not null check (overall_score between 0 and 10),
  verdict text not null check (verdict in ('needs_work', 'solid', 'excellent')),
  summary text not null,
  strengths text not null,
  weaknesses text not null,
  revision_advice text not null,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at desc);
create index if not exists attempts_challenge_idx on public.attempts(challenge_id);
create index if not exists evaluations_user_created_idx on public.evaluations(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.attempts enable row level security;
alter table public.evaluations enable row level security;

drop policy if exists "Profiles are visible to owner" on public.profiles;
create policy "Profiles are visible to owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are editable by owner" on public.profiles;
create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Challenges are readable" on public.challenges;
create policy "Challenges are readable"
  on public.challenges for select
  using (true);

drop policy if exists "Users insert own attempts" on public.attempts;
create policy "Users insert own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own attempts" on public.attempts;
create policy "Users read own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own attempts" on public.attempts;
create policy "Users update own attempts"
  on public.attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users insert own evaluations" on public.evaluations;
create policy "Users insert own evaluations"
  on public.evaluations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.attempts
      where attempts.id = attempt_id
        and attempts.user_id = auth.uid()
    )
  );

drop policy if exists "Users read own evaluations" on public.evaluations;
create policy "Users read own evaluations"
  on public.evaluations for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

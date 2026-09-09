/* Run once in Supabase SQL Editor. All statements are safe to re-run. */
alter table if exists public.profiles add column if not exists interests text;
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username)) where username is not null and username <> '';

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  type text not null default 'general',
  actor_id uuid references auth.users(id) on delete set null,
  entity_id text,
  url text,
  created_at timestamptz not null default now()
);
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists type text not null default 'general';
alter table public.notifications add column if not exists actor_id uuid references auth.users(id) on delete set null;
alter table public.notifications add column if not exists entity_id text;
alter table public.notifications add column if not exists url text;
alter table public.notifications add column if not exists created_at timestamptz not null default now();
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
alter table public.notifications replica identity full;
alter table public.notifications enable row level security;
drop policy if exists "Maxe notifications read own" on public.notifications;
create policy "Maxe notifications read own" on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Maxe notifications update own" on public.notifications;
create policy "Maxe notifications update own" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Maxe notifications insert authenticated" on public.notifications;
create policy "Maxe notifications insert authenticated" on public.notifications for insert to authenticated with check (true);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null default 'reminder',
  marks integer,
  event_date date not null,
  reminder_time time,
  created_at timestamptz not null default now()
);
alter table public.calendar_events add column if not exists reminder_time time;
create index if not exists calendar_events_user_date_idx on public.calendar_events(user_id, event_date);
alter table public.calendar_events enable row level security;
drop policy if exists "Maxe calendar own rows" on public.calendar_events;
create policy "Maxe calendar own rows" on public.calendar_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_messages_group_created_idx on public.community_messages(community_id, created_at);
alter table public.community_messages replica identity full;
alter table public.community_messages enable row level security;
drop policy if exists "Maxe community messages read" on public.community_messages;
create policy "Maxe community messages read" on public.community_messages for select to authenticated using (true);
drop policy if exists "Maxe community messages insert own" on public.community_messages;
create policy "Maxe community messages insert own" on public.community_messages for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  created_at timestamptz not null default now()
);
create index if not exists study_activity_user_created_idx on public.study_activity(user_id, created_at desc);
alter table public.study_activity enable row level security;
drop policy if exists "Maxe study activity own" on public.study_activity;
create policy "Maxe study activity own" on public.study_activity for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_messages') then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end $$;

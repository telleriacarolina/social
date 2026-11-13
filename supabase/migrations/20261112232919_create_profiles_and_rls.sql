-- Profiles are private by default.
-- Each profile belongs to exactly one Supabase Auth user.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,30}$'
  ),
  constraint display_name_length check (
    display_name is null
    or char_length(display_name) <= 80
  ),
  constraint bio_length check (
    bio is null
    or char_length(bio) <= 500
  )
);

-- Enable Row Level Security.
alter table public.profiles enable row level security;

-- Explicitly limit table access to authenticated users.
revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- Users can read only their own profile.
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Users can create only a profile belonging to themselves.
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

-- Users can update only their own profile.
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Automatically maintain updated_at.
create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

-- Create an empty profile whenever a new Auth user is registered.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- These functions are invoked by database triggers, not directly by clients.
revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ==============================================================================
-- KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
-- Supabase Schema for User Roles and Authentication
-- ==============================================================================

-- 1. Create public.users table to store user roles ('citizen', 'rescue', 'authority')
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text check (role in ('citizen', 'rescue', 'authority')) default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- 3. RLS Policies
-- Users can read their own profile
create policy "Users can view own profile" 
on public.users for select 
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" 
on public.users for update 
using (auth.uid() = id);

-- Allow new user registration insertion
create policy "Allow insert on registration"
on public.users for insert
with check (true);

-- 4. Trigger to automatically mirror auth.users signups into public.users with role
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'citizen')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

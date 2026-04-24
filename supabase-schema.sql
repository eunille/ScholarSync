-- =====================================================
-- AI TUTOR DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Chat sessions table (one per subject chat)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null check (subject in ('maths', 'science', 'english')),
  created_at timestamptz default now() not null
);

-- Messages table (conversation history)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz default now() not null
);

-- Create indexes for performance
create index if not exists idx_chat_sessions_user_id on chat_sessions(user_id);
create index if not exists idx_chat_sessions_subject on chat_sessions(subject);
create index if not exists idx_messages_session_id on messages(session_id);
create index if not exists idx_messages_created_at on messages(created_at);

-- Enable Row Level Security
alter table chat_sessions enable row level security;
alter table messages enable row level security;

-- RLS Policies: Users can only see their own data
create policy "Users can view own sessions"
  on chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on chat_sessions for delete
  using (auth.uid() = user_id);

create policy "Users can view own messages"
  on messages for select
  using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on messages for insert
  with check (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on messages for delete
  using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );

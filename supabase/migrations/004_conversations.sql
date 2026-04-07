-- Tabela de conversas
create table public.conversations (
  id         uuid primary key default uuid_generate_v4(),
  title      text,
  user_id    uuid references auth.users(id) on delete cascade,
  metadata   jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_updated_at on public.conversations(updated_at desc);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function update_updated_at();

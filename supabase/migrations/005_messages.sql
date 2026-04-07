-- Tabela de mensagens
create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  attachments     jsonb default '[]', -- [{name, url, mime_type, storage_path}]
  rag_chunks_used jsonb default '[]', -- IDs dos chunks usados na resposta
  tokens_used     integer,
  created_at      timestamptz default now()
);

create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at asc);

-- Row Level Security para todas as tabelas

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Documents: todos autenticados podem ler e inserir; dono pode deletar
create policy "authenticated_read_documents" on public.documents
  for select using (auth.role() = 'authenticated');

create policy "authenticated_insert_documents" on public.documents
  for insert with check (auth.uid() = created_by);

create policy "authenticated_update_documents" on public.documents
  for update using (auth.uid() = created_by);

create policy "authenticated_delete_documents" on public.documents
  for delete using (auth.uid() = created_by);

-- Chunks: todos autenticados podem ler; apenas service_role pode inserir/atualizar
create policy "authenticated_read_chunks" on public.document_chunks
  for select using (auth.role() = 'authenticated');

create policy "service_role_manage_chunks" on public.document_chunks
  for all using (auth.role() = 'service_role');

-- Conversations: usuário vê apenas as próprias
create policy "user_owns_conversations" on public.conversations
  for all using (auth.uid() = user_id);

-- Messages: usuário vê mensagens das próprias conversas
create policy "user_owns_messages" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Tabela de documentos da base de conhecimento
create table public.documents (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  file_type    text not null, -- 'pdf', 'docx', 'xlsx', 'image', 'audio', 'video', 'pptx'
  storage_path text not null, -- caminho no Supabase Storage
  file_size    bigint not null,
  mime_type    text not null,
  status       text not null default 'processing', -- 'processing' | 'ready' | 'error'
  error_msg    text,
  metadata     jsonb default '{}',
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_documents_status on public.documents(status);
create index idx_documents_file_type on public.documents(file_type);
create index idx_documents_created_at on public.documents(created_at desc);

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();

-- Tabela de chunks com embeddings vetoriais (coração do RAG)
create table public.document_chunks (
  id           uuid primary key default uuid_generate_v4(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  content      text not null,
  embedding    vector(768), -- dimensão do text-embedding-004
  chunk_index  integer not null,
  token_count  integer,
  metadata     jsonb default '{}', -- page_number, section_title, etc.
  created_at   timestamptz default now()
);

-- Índice IVFFlat para busca por similaridade aproximada (cosine)
create index idx_chunks_embedding on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index idx_chunks_document_id on public.document_chunks(document_id);

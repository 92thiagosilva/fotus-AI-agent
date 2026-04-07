-- Função de busca por similaridade vetorial (pgvector)
create or replace function match_document_chunks(
  query_embedding    vector(768),
  match_count        integer default 8,
  similarity_threshold float default 0.70,
  filter_document_ids  uuid[] default null
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where
    (filter_document_ids is null or dc.document_id = any(filter_document_ids))
    and 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

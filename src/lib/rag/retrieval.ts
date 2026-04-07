import { createServiceClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/gemini/embeddings'

export interface RetrievedChunk {
  id: string
  documentId: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

/**
 * Recupera os chunks mais relevantes para uma query usando busca vetorial.
 */
export async function retrieveRelevantChunks(
  query: string,
  options: {
    matchCount?: number
    similarityThreshold?: number
    filterDocumentIds?: string[]
  } = {}
): Promise<RetrievedChunk[]> {
  const {
    matchCount = 8,
    similarityThreshold = 0.65,
    filterDocumentIds,
  } = options

  const supabase = createServiceClient()

  // Gera embedding da query
  const queryEmbedding = await embedText(query)

  // Chama função pgvector no Supabase
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
    filter_document_ids: filterDocumentIds ?? null,
  })

  if (error) {
    console.error('Erro na busca vetorial:', error)
    return []
  }

  return (data ?? []).map((row: {
    id: string
    document_id: string
    content: string
    metadata: Record<string, unknown>
    similarity: number
  }) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity,
  }))
}

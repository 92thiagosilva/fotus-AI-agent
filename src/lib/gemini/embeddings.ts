import { getGeminiClient, EMBEDDING_MODEL } from './client'

/**
 * Gera embedding vetorial para um texto usando gemini-embedding-001.
 * Usa outputDimensionality=768 para manter compatibilidade com o schema do banco.
 * @param taskType 'RETRIEVAL_DOCUMENT' para indexar, 'RETRIEVAL_QUERY' para buscar
 */
export async function embedText(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })

  // outputDimensionality não está na tipagem do SDK v0.24.x mas é suportado pela API
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType: taskType,
    outputDimensionality: 768,
  } as never)
  return result.embedding.values
}

/**
 * Gera embeddings em lote com controle de rate limit (5 por vez).
 */
export async function embedTextBatch(
  texts: string[],
  batchSize = 5
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(embedText))
    embeddings.push(...results)

    // Pausa entre lotes para respeitar rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return embeddings
}

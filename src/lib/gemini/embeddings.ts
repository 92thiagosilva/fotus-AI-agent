import { getGeminiClient, EMBEDDING_MODEL } from './client'

/**
 * Gera embedding vetorial para um texto usando text-embedding-004.
 * Retorna vetor de 768 dimensões.
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL })

  const result = await model.embedContent(text)
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

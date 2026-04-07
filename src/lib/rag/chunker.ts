export interface Chunk {
  content: string
  chunkIndex: number
  tokenCount: number
  metadata: Record<string, unknown>
}

const CHUNK_SIZE = 1000 // caracteres
const OVERLAP = 150 // sobreposição entre chunks

/**
 * Divide texto em chunks com sobreposição, respeitando quebras de parágrafo e sentenças.
 */
export function chunkText(
  text: string,
  options: { size?: number; overlap?: number; metadata?: Record<string, unknown> } = {}
): Chunk[] {
  const size = options.size ?? CHUNK_SIZE
  const overlap = options.overlap ?? OVERLAP
  const baseMetadata = options.metadata ?? {}

  // Limpa texto
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!cleaned) return []

  // Divide por parágrafos primeiro para preservar contexto
  const paragraphs = cleaned.split(/\n\n+/)
  const chunks: Chunk[] = []
  let buffer = ''
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length + 2 <= size) {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph
    } else {
      // Salva buffer atual se tiver conteúdo
      if (buffer.trim()) {
        chunks.push(makeChunk(buffer.trim(), chunkIndex++, baseMetadata))
      }

      // Se parágrafo é maior que size, divide por sentenças
      if (paragraph.length > size) {
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph]
        buffer = ''

        for (const sentence of sentences) {
          if (buffer.length + sentence.length + 1 <= size) {
            buffer = buffer ? `${buffer} ${sentence}` : sentence
          } else {
            if (buffer.trim()) {
              chunks.push(makeChunk(buffer.trim(), chunkIndex++, baseMetadata))
            }
            // Inicia novo buffer com overlap do chunk anterior
            const lastChunk = chunks[chunks.length - 1]
            const overlapText = lastChunk
              ? lastChunk.content.slice(-overlap)
              : ''
            buffer = overlapText ? `${overlapText} ${sentence}` : sentence
          }
        }
      } else {
        // Inicia novo buffer com overlap
        const lastChunk = chunks[chunks.length - 1]
        const overlapText = lastChunk ? lastChunk.content.slice(-overlap) : ''
        buffer = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph
      }
    }
  }

  // Último buffer
  if (buffer.trim()) {
    chunks.push(makeChunk(buffer.trim(), chunkIndex++, baseMetadata))
  }

  return chunks
}

function makeChunk(
  content: string,
  chunkIndex: number,
  metadata: Record<string, unknown>
): Chunk {
  return {
    content,
    chunkIndex,
    tokenCount: Math.ceil(content.length / 4), // estimativa: 4 chars ≈ 1 token
    metadata,
  }
}

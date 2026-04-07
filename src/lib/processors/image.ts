import { extractTextWithGeminiVision } from '@/lib/gemini/multimodal'

/**
 * Extrai texto e descrição de uma imagem via Gemini Vision.
 */
export async function extractImageText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  return extractTextWithGeminiVision(
    buffer,
    mimeType,
    `Analise esta imagem e:
1. Se contiver texto, transcreva-o completamente
2. Descreva o conteúdo técnico relevante (equipamentos, especificações, tabelas, gráficos)
3. Se for um orçamento ou proposta comercial, extraia todos os itens, quantidades e valores

Responda em português.`
  )
}

import { Part } from '@google/generative-ai'
import { getGeminiClient, GEMINI_MODEL } from './client'

export interface FileAttachment {
  name: string
  mimeType: string
  data: Buffer | string // Buffer para binários, string base64
}

/**
 * Converte um arquivo para a Part do Gemini baseado no MIME type.
 * Suporta: imagens, áudio, PDFs, vídeos.
 */
export function fileToGeminiPart(attachment: FileAttachment): Part {
  const base64Data =
    typeof attachment.data === 'string'
      ? attachment.data
      : attachment.data.toString('base64')

  return {
    inlineData: {
      mimeType: attachment.mimeType,
      data: base64Data,
    },
  }
}

/**
 * Usa Gemini Vision para extrair texto de imagens ou PDFs escaneados.
 * Retorna o texto extraído.
 */
export async function extractTextWithGeminiVision(
  fileData: Buffer,
  mimeType: string,
  prompt = 'Extraia todo o texto desta imagem/documento de forma precisa e completa. Mantenha a estrutura original.'
): Promise<string> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })

  const imagePart: Part = {
    inlineData: {
      mimeType,
      data: fileData.toString('base64'),
    },
  }

  const result = await model.generateContent([prompt, imagePart])
  return result.response.text()
}

/**
 * Transcreve áudio usando Gemini.
 */
export async function transcribeAudio(
  audioData: Buffer,
  mimeType: string
): Promise<string> {
  return extractTextWithGeminiVision(
    audioData,
    mimeType,
    'Transcreva com precisão todo o conteúdo deste áudio em português. Inclua pontuação.'
  )
}

/**
 * Descreve e extrai informações de uma imagem de orçamento/concorrente.
 */
export async function analyzeCompetitorImage(
  imageData: Buffer,
  mimeType: string
): Promise<string> {
  return extractTextWithGeminiVision(
    imageData,
    mimeType,
    `Analise esta imagem de orçamento/proposta comercial e extraia:
1. Todos os produtos listados com quantidade e preço
2. Valores totais
3. Empresa/concorrente identificado (se visível)
4. Especificações técnicas mencionadas
5. Condições comerciais (prazo, garantia, etc.)

Formate a resposta de forma estruturada.`
  )
}

import { extractTextWithGeminiVision } from '@/lib/gemini/multimodal'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

/**
 * Extrai texto de um PDF.
 * Se o PDF for escaneado (pouco texto), usa Gemini Vision como fallback.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer)
    const avgCharsPerPage = data.text.length / Math.max(data.numpages, 1)

    // PDF escaneado: menos de 100 chars por página em média
    if (avgCharsPerPage < 100) {
      return extractTextWithGeminiVision(buffer, 'application/pdf')
    }

    return data.text
  } catch {
    // Se pdf-parse falhar, tenta Gemini Vision
    return extractTextWithGeminiVision(buffer, 'application/pdf')
  }
}

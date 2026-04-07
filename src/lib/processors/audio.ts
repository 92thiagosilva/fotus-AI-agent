import { transcribeAudio } from '@/lib/gemini/multimodal'

/**
 * Transcreve áudio para texto via Gemini.
 */
export async function extractAudioText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  return transcribeAudio(buffer, mimeType)
}

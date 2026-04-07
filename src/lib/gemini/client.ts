import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY não configurada')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export const GEMINI_MODEL = 'gemini-2.5-flash'
export const EMBEDDING_MODEL = 'gemini-embedding-001'

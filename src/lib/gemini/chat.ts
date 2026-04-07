import { Content, Part } from '@google/generative-ai'
import { getGeminiClient, GEMINI_MODEL } from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  attachments?: Array<{
    mimeType: string
    data: string // base64
  }>
}

/**
 * Converte histórico de mensagens para o formato de Content[] do Gemini.
 */
function buildHistory(messages: ChatMessage[]): Content[] {
  return messages.map((msg) => {
    const parts: Part[] = [{ text: msg.content }]

    if (msg.attachments?.length) {
      parts.push(
        ...msg.attachments.map((att) => ({
          inlineData: { mimeType: att.mimeType, data: att.data },
        }))
      )
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    }
  })
}

/**
 * Cria um stream de resposta do Gemini com suporte a RAG e multimodal.
 * Retorna um ReadableStream de texto.
 */
export async function createChatStream(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  attachments?: Array<{ mimeType: string; data: string }>
): Promise<ReadableStream<string>> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  })

  // Histórico exclui a última mensagem do usuário (será enviada como nova)
  const chatHistory = buildHistory(history)

  const chat = model.startChat({ history: chatHistory })

  // Monta partes da mensagem atual
  const userParts: Part[] = [{ text: userMessage }]
  if (attachments?.length) {
    userParts.push(
      ...attachments.map((att) => ({
        inlineData: { mimeType: att.mimeType, data: att.data },
      }))
    )
  }

  const streamResult = await chat.sendMessageStream(userParts)

  // Retorna ReadableStream que emite chunks de texto
  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of streamResult.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(text)
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

/**
 * Gera um título curto para uma conversa a partir da primeira mensagem.
 */
export async function generateConversationTitle(
  firstMessage: string
): Promise<string> {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })

  const result = await model.generateContent(
    `Gere um título de até 6 palavras em português para uma conversa que começa com: "${firstMessage.slice(0, 200)}". Responda APENAS o título, sem aspas ou pontuação extra.`
  )

  return result.response.text().trim().slice(0, 60)
}

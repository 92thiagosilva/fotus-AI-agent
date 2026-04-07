import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { retrieveRelevantChunks } from '@/lib/rag/retrieval'
import { buildSystemPrompt } from '@/lib/rag/contextBuilder'
import { createChatStream, generateConversationTitle } from '@/lib/gemini/chat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { conversationId, message, attachments = [] } = await request.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  let activeConversationId = conversationId

  // Cria nova conversa se necessário
  if (!activeConversationId) {
    const { data: conv, error } = await serviceClient
      .from('conversations')
      .insert({ user_id: user.id, title: null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    activeConversationId = conv.id
  }

  // Salva mensagem do usuário
  const { data: userMsg } = await serviceClient
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
      attachments: attachments ?? [],
    })
    .select()
    .single()

  // Busca histórico (últimas 20 mensagens)
  const { data: history } = await serviceClient
    .from('messages')
    .select('role, content')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  // Busca RAG
  const relevantChunks = await retrieveRelevantChunks(message, { matchCount: 8 })

  // Monta system prompt com contexto
  const systemPrompt = buildSystemPrompt(relevantChunks)

  // Prepara histórico excluindo a mensagem atual (última)
  const chatHistory = (history ?? [])
    .slice(0, -1)
    .map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // Cria stream de resposta
  let fullResponse = ''

  const stream = await createChatStream(
    systemPrompt,
    chatHistory,
    message,
    attachments
  )

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      // Envia conversationId primeiro
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'meta', conversationId: activeConversationId })}\n\n`
        )
      )

      const reader = stream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += value
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', delta: value })}\n\n`)
          )
        }
      } finally {
        reader.releaseLock()
      }

      // Salva resposta do assistente
      const { data: assistantMsg } = await serviceClient
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: fullResponse,
          rag_chunks_used: relevantChunks.map((c) => c.id),
        })
        .select()
        .single()

      // Gera título se for a primeira resposta
      const isFirstMessage = (history ?? []).length <= 1
      if (isFirstMessage) {
        const title = await generateConversationTitle(message).catch(() => message.slice(0, 50))
        await serviceClient
          .from('conversations')
          .update({ title })
          .eq('id', activeConversationId)
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'done', messageId: assistantMsg?.id })}\n\n`
        )
      )
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

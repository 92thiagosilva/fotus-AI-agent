'use client'

import { useState, useCallback, useRef } from 'react'
import { Message, PendingAttachment } from '@/types/chat'

interface UseChatOptions {
  conversationId?: string
  initialMessages?: Message[]
  onConversationCreated?: (id: string) => void
}

export function useChat(options: UseChatOptions = {}) {
  const { conversationId: initialConvId, initialMessages = [], onConversationCreated } = options

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConvId ?? null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (text: string, attachments: PendingAttachment[] = []) => {
      if (isStreaming || !text.trim()) return

      // Monta attachments para envio
      const attachmentPayload = attachments
        .filter((a) => a.uploaded)
        .map((a) => ({ name: a.file.name, mimeType: a.file.type, storagePath: a.storagePath, url: a.url }))

      // Adiciona mensagem do usuário imediatamente
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId ?? '',
        role: 'user',
        content: text,
        attachments: attachmentPayload,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setPendingAttachments([])
      setIsStreaming(true)

      // Placeholder da resposta do assistente
      const assistantMsgId = `streaming-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          conversationId: conversationId ?? '',
          role: 'assistant',
          content: '',
          attachments: [],
          createdAt: new Date().toISOString(),
        },
      ])

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: text,
            attachments: attachmentPayload,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok || !response.body) throw new Error('Erro na resposta')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'meta' && data.conversationId) {
                setConversationId(data.conversationId)
                onConversationCreated?.(data.conversationId)
              }

              if (data.type === 'text') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + data.delta }
                      : m
                  )
                )
              }

              if (data.type === 'done' && data.messageId) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, id: data.messageId } : m
                  )
                )
              }
            } catch { /* ignora JSON inválido */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: 'Erro ao processar sua mensagem. Tente novamente.' }
                : m
            )
          )
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [conversationId, isStreaming, onConversationCreated]
  )

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const addAttachment = useCallback((file: File) => {
    const pending: PendingAttachment = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: false,
    }
    setPendingAttachments((prev) => [...prev, pending])
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.preview) URL.revokeObjectURL(att.preview)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  return {
    messages,
    isStreaming,
    conversationId,
    pendingAttachments,
    sendMessage,
    stopStreaming,
    addAttachment,
    removeAttachment,
  }
}
